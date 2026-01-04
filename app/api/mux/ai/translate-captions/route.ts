import { NextRequest, NextResponse } from "next/server";
import { muxVideo } from "@/lib/mux";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/ai-config";

// Allow up to 60 seconds for translation (serverless timeout config)
export const maxDuration = 60;

/**
 * POST /api/mux/ai/translate-captions
 * Translate video captions to another language using AI
 * 
 * Request body:
 * - assetId: Mux asset ID
 * - targetLanguage: ISO 639-1 language code (e.g., 'es', 'hi', 'fr')
 * 
 * Response:
 * - success: boolean
 * - trackId: ID of the new caption track
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, targetLanguage } = body;

    if (!assetId || !targetLanguage) {
      return NextResponse.json(
        { error: "assetId and targetLanguage are required" },
        { status: 400 }
      );
    }

    // Validate target language
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage);
    if (!langConfig) {
      return NextResponse.json(
        { 
          error: "Unsupported language",
          supported: SUPPORTED_LANGUAGES.map(l => l.code)
        },
        { status: 400 }
      );
    }

    // Get asset and verify it's ready
    const asset = await muxVideo.assets.retrieve(assetId);
    if (asset.status !== "ready") {
      return NextResponse.json(
        { error: "Asset is not ready" },
        { status: 400 }
      );
    }

    const playbackId = asset.playback_ids?.[0]?.id;
    if (!playbackId) {
      return NextResponse.json(
        { error: "Asset has no playback ID" },
        { status: 400 }
      );
    }

    // Find the subtitle track (prefer 'text' type with 'subtitles' text_type)
    // This is more reliable than assuming 'captions.vtt' alias works
    const track = asset.tracks?.find(t => t.type === 'text' && t.text_type === 'subtitles');
    
    if (!track) {
      return NextResponse.json(
        { 
          error: "Captions not available",
          hint: "Auto-captions may still be processing. Try again in a few minutes.",
          details: "No text track found on asset"
        },
        { status: 400 }
      );
    }

    if (track.status === 'errored') {
       return NextResponse.json(
        { error: "Caption generation failed" },
        { status: 400 }
       );
    }

    // Use specific track ID 
    const vttUrl = `https://stream.mux.com/${playbackId}/text/${track.id}.vtt`;
    console.log(`[Translation] Fetching VTT from: ${vttUrl}`);
    const vttResponse = await fetch(vttUrl);
    
    if (!vttResponse.ok) {
      return NextResponse.json(
        { 
          error: "Failed to fetch captions",
          hint: "The track exists but could not be downloaded.",
          details: `Fetch error ${vttResponse.status}`
        },
        { status: 400 }
      );
    }

    const sourceVtt = await vttResponse.text();

    // Translate the VTT content
    const translatedVtt = await translateVttContent(
      sourceVtt, 
      targetLanguage as LanguageCode
    );

    // Create a text track with the translated content
    const trackResult = await createTranslatedTrack(
      assetId, 
      translatedVtt, 
      targetLanguage as LanguageCode,
      langConfig.name
    );

    return NextResponse.json({
      success: true,
      assetId,
      language: targetLanguage, // Matches TranslationResult interface
      targetLanguage,
      languageName: langConfig.name,
      trackId: trackResult.trackId,
      message: `Captions translated to ${langConfig.name}`,
    });
  } catch (error) {
    console.error("Error translating captions:", error);
    return NextResponse.json(
      { 
        error: "Failed to translate captions",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Translate VTT content using AI
 */
async function translateVttContent(
  vtt: string,
  targetLanguage: LanguageCode
): Promise<string> {
  // Prefer Gemini, fallback to OpenAI
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY) {
    return translateWithGemini(vtt, targetLanguage);
  } else if (process.env.OPENAI_API_KEY) {
    return translateWithOpenAI(vtt, targetLanguage);
  } else {
    throw new Error("No AI provider configured for translation");
  }
}

async function translateWithGemini(
  vtt: string,
  targetLanguage: LanguageCode
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY!;
  
  const prompt = `Translate this WebVTT caption file to ${targetLanguage}. 
Keep the exact VTT format including timestamps. Only translate the text content.
Do not translate "WEBVTT" or timestamps.

${vtt}

Respond with ONLY the translated VTT file, nothing else.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini translation error: ${response.status}`);
  }

  const data = await response.json();
  const translated = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  // Clean up any markdown code blocks
  return translated.replace(/```vtt\n?/g, "").replace(/```\n?/g, "").trim();
}

async function translateWithOpenAI(
  vtt: string,
  targetLanguage: LanguageCode
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a caption translator. Translate VTT captions to ${targetLanguage}. Keep exact VTT format and timestamps.`,
        },
        {
          role: "user",
          content: vtt,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI translation error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Initialize Supabase Admin Client for server-side uploads
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use Service Role Key for admin access (skips RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Create a translated text track on the asset
 * 1. Upload VTT to Supabase Storage
 * 2. Add track to Mux Asset via URL
 */
async function createTranslatedTrack(
  assetId: string,
  vttContent: string,
  languageCode: LanguageCode,
  languageName: string
): Promise<{ trackId: string; language: LanguageCode }> {
  
  if (!supabaseUrl || !supabaseServiceKey) {
     throw new Error("Missing Supabase configuration (URL or Service Role Key)");
  }

  // 1. Clean up existing tracks to avoid "Track name not unique" errors
  try {
    const asset = await muxVideo.assets.retrieve(assetId);
    const targetName = languageName ?? String(languageCode);
    
    const existingTrack = asset.tracks?.find(t => 
      t.type === 'text' && 
      t.text_type === 'subtitles' && 
      (t.name === targetName || t.language_code === languageCode)
    );

    if (existingTrack && existingTrack.id) {
       console.log(`[Translation] Deleting existing track ${existingTrack.id} to allow update`);
       await muxVideo.assets.deleteTrack(assetId, existingTrack.id);
    }
  } catch (err) {
    console.warn("Warning during track cleanup:", err);
    // Continue - if creating fails, the main error handler will catch it
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // 2. Upload to Supabase Storage
  const fileName = `captions/${assetId}/${languageCode}.vtt`;
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('climate-media')
    .upload(fileName, vttContent, {
      contentType: 'text/vtt',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload captions to storage: ${uploadError.message}`);
  }

  // 3. Get Public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('climate-media')
    .getPublicUrl(fileName);

  console.log(`[Translation] Uploaded to ${publicUrl}`);

  // 4. Create Mux Track
    const track = await muxVideo.assets.createTrack(assetId, {
    url: publicUrl,
    type: 'text',
    text_type: 'subtitles',
    language_code: languageCode,
    name: languageName ?? String(languageCode),
    closed_captions: false
  });

  console.log(`[Translation] Added track ${track.id} to asset ${assetId}`);

  return {
    trackId: track.id || "",
    language: languageCode,
  };
}

/**
 * GET /api/mux/ai/translate-captions
 * Get available languages for translation
 */
export async function GET() {
  return NextResponse.json({
    supportedLanguages: SUPPORTED_LANGUAGES,
    requirements: {
      gemini: !!process.env.GOOGLE_GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    },
  });
}
