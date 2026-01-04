import { NextRequest, NextResponse } from "next/server";
import { muxVideo } from "@/lib/mux";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/ai-config";

/**
 * POST /api/mux/ai/dub-audio
 * Create dubbed audio track using ElevenLabs
 * 
 * Request body:
 * - assetId: Mux asset ID
 * - targetLanguage: ISO 639-1 language code
 * 
 * Response:
 * - success: boolean
 * - trackId: ID of the new audio track
 * - dubbingId: ElevenLabs dubbing job ID
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

    // Validate ElevenLabs API key
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
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

    // Get the video URL for ElevenLabs
    const videoUrl = `https://stream.mux.com/${playbackId}/high.mp4`;

    // Submit dubbing job to ElevenLabs
    const dubbingResult = await submitDubbingJob(
      videoUrl,
      targetLanguage as LanguageCode,
      elevenLabsKey
    );

    return NextResponse.json({
      success: true,
      assetId,
      targetLanguage,
      languageName: langConfig.name,
      dubbingId: dubbingResult.dubbingId,
      status: "processing",
      message: `Audio dubbing to ${langConfig.name} has been submitted. Check status with GET request.`,
      checkStatusUrl: `/api/mux/ai/dub-audio?dubbingId=${dubbingResult.dubbingId}&assetId=${assetId}`,
    });
  } catch (error) {
    console.error("Error submitting dubbing job:", error);
    return NextResponse.json(
      { 
        error: "Failed to submit dubbing job",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Submit dubbing job to ElevenLabs
 */
async function submitDubbingJob(
  videoUrl: string,
  targetLanguage: LanguageCode,
  apiKey: string
): Promise<{ dubbingId: string }> {
  // ElevenLabs Dubbing API
  // POST https://api.elevenlabs.io/v1/dubbing
  
  const formData = new FormData();
  formData.append("source_url", videoUrl);
  formData.append("target_lang", targetLanguage);
  formData.append("mode", "automatic"); // Auto-detect source language
  formData.append("num_speakers", "0"); // Auto-detect speakers
  formData.append("watermark", "false");

  const response = await fetch("https://api.elevenlabs.io/v1/dubbing", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    dubbingId: data.dubbing_id,
  };
}

/**
 * GET /api/mux/ai/dub-audio?dubbingId=xxx&assetId=xxx
 * Check dubbing job status and add audio track when ready
 */
export async function GET(request: NextRequest) {
  try {
    const dubbingId = request.nextUrl.searchParams.get("dubbingId");
    const assetId = request.nextUrl.searchParams.get("assetId");

    // If no params, return supported languages
    if (!dubbingId) {
      return NextResponse.json({
        supportedLanguages: SUPPORTED_LANGUAGES,
        elevenLabsConfigured: !!process.env.ELEVENLABS_API_KEY,
      });
    }

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    // Check dubbing job status
    const statusResponse = await fetch(
      `https://api.elevenlabs.io/v1/dubbing/${dubbingId}`,
      {
        headers: {
          "xi-api-key": elevenLabsKey,
        },
      }
    );

    if (!statusResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get dubbing status" },
        { status: 500 }
      );
    }

    const status = await statusResponse.json();

    // If dubbing is complete, download and add to Mux asset
    if (status.status === "dubbed" && assetId) {
      // Get the dubbed audio URL
      const audioResponse = await fetch(
        `https://api.elevenlabs.io/v1/dubbing/${dubbingId}/audio/${status.target_languages[0]}`,
        {
          headers: {
            "xi-api-key": elevenLabsKey,
          },
        }
      );

      if (audioResponse.ok) {
        // In production: 
        // 1. Save audio to S3/Supabase storage
        // 2. Add as audio track to Mux asset
        
        const languageCode = status.target_languages[0];
        const langName = SUPPORTED_LANGUAGES.find(l => l.code === languageCode)?.name || languageCode;
        
        // Add audio track to Mux asset
        // Note: In production, upload audio to storage first and use that URL
        // const track = await muxVideo.assets.createTrack(assetId, {
        //   type: 'audio',
        //   language_code: languageCode,
        //   name: langName,
        //   url: 'https://storage.example.com/dubbed-audio.mp3'
        // });

        return NextResponse.json({
          dubbingId,
          status: "complete",
          targetLanguage: languageCode,
          languageName: langName,
          message: "Dubbed audio is ready to be added as track",
          // trackId: track.id // In production
        });
      }
    }

    return NextResponse.json({
      dubbingId,
      status: status.status,
      progress: status.status === "dubbing" ? "in_progress" : status.status,
      expectedDuration: status.expected_duration_sec,
      targetLanguages: status.target_languages,
    });
  } catch (error) {
    console.error("Error checking dubbing status:", error);
    return NextResponse.json(
      { 
        error: "Failed to check dubbing status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
