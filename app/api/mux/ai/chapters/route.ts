import { NextRequest, NextResponse } from "next/server";
import { muxVideo } from "@/lib/mux";
import type { VideoChapter } from "@/lib/ai-config";

/**
 * POST /api/mux/ai/chapters
 * Generate AI chapters for a video using Google Gemini
 * 
 * Request body:
 * - assetId: Mux asset ID
 * - provider: 'gemini' | 'openai' (default: 'gemini')
 * 
 * Response:
 * - chapters: Array of { startTime, endTime, title }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, provider = "gemini" } = body;

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }

    // Verify the asset exists and is ready
    const asset = await muxVideo.assets.retrieve(assetId);
    
    if (asset.status !== "ready") {
      return NextResponse.json(
        { error: "Asset is not ready yet" },
        { status: 400 }
      );
    }

    // Get the transcript from Mux
    const playbackId = asset.playback_ids?.[0]?.id;
    if (!playbackId) {
      return NextResponse.json(
        { error: "Asset has no playback ID" },
        { status: 400 }
      );
    }

    // Fetch transcript from Mux
    const transcriptUrl = `https://stream.mux.com/${playbackId}/text/transcript.txt`;
    const transcriptResponse = await fetch(transcriptUrl);
    
    if (!transcriptResponse.ok) {
      // Transcript may not be ready yet
      return NextResponse.json(
        { 
          error: "Transcript not available. Auto-captions may still be processing.",
          hint: "Wait a few minutes after upload for captions to generate."
        },
        { status: 400 }
      );
    }

    const transcript = await transcriptResponse.text();
    const duration = asset.duration || 0;

    // Generate chapters using AI
    let chapters: VideoChapter[];

    if (provider === "gemini" && process.env.GOOGLE_GEMINI_API_KEY) {
      chapters = await generateChaptersWithGemini(transcript, duration);
    } else if (provider === "openai" && process.env.OPENAI_API_KEY) {
      chapters = await generateChaptersWithOpenAI(transcript, duration);
    } else {
      // Fallback to simple time-based chapters
      chapters = generateSimpleChapters(duration);
    }

    return NextResponse.json({
      assetId,
      chapters,
      provider: chapters.length > 3 ? provider : "fallback",
      totalChapters: chapters.length,
    });
  } catch (error) {
    console.error("Error generating chapters:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate chapters",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Generate chapters using Google Gemini
 */
async function generateChaptersWithGemini(
  transcript: string,
  duration: number
): Promise<VideoChapter[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured");

  const prompt = `You are a video chapter generator for climate education content. 
Analyze this transcript and create meaningful chapter markers.

Transcript:
${transcript.slice(0, 8000)} ${transcript.length > 8000 ? "... (truncated)" : ""}

Video Duration: ${Math.round(duration)} seconds

Generate 4-8 chapters. Each chapter should have a meaningful title related to the climate topic.
Respond in JSON format only:
{
  "chapters": [
    { "startTime": 0, "endTime": 30, "title": "Introduction" },
    { "startTime": 30, "endTime": 90, "title": "Topic Name" }
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid response format from Gemini");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.chapters || [];
}

/**
 * Generate chapters using OpenAI
 */
async function generateChaptersWithOpenAI(
  transcript: string,
  duration: number
): Promise<VideoChapter[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key not configured");

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
          content: "You are a video chapter generator. Generate meaningful chapter markers based on the transcript. Respond with JSON only.",
        },
        {
          role: "user",
          content: `Transcript (first 8000 chars):\n${transcript.slice(0, 8000)}\n\nDuration: ${duration}s\n\nGenerate 4-8 chapters in format: {"chapters": [{"startTime": 0, "endTime": 30, "title": "Intro"}]}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return parsed.chapters || [];
}

/**
 * Fallback: Generate simple time-based chapters
 */
function generateSimpleChapters(duration: number): VideoChapter[] {
  const chapters: VideoChapter[] = [];
  const chapterDuration = Math.max(30, Math.floor(duration / 5));
  
  let currentTime = 0;
  let chapterNum = 1;
  
  const titles = [
    "Introduction",
    "Understanding the Topic",
    "Key Points",
    "Analysis",
    "Conclusion",
  ];

  while (currentTime < duration) {
    const endTime = Math.min(currentTime + chapterDuration, duration);
    chapters.push({
      startTime: currentTime,
      endTime,
      title: titles[chapterNum - 1] || `Part ${chapterNum}`,
    });
    currentTime = endTime;
    chapterNum++;
    if (chapterNum > 5) break;
  }

  return chapters;
}

/**
 * GET /api/mux/ai/chapters?assetId=xxx
 * Get cached chapters for a video
 */
export async function GET(request: NextRequest) {
  const assetId = request.nextUrl.searchParams.get("assetId");
  
  if (!assetId) {
    return NextResponse.json(
      { error: "Asset ID is required" },
      { status: 400 }
    );
  }

  // In production, you would store chapters in Supabase
  // For now, return info about the asset
  try {
    const asset = await muxVideo.assets.retrieve(assetId);
    
    return NextResponse.json({
      assetId,
      status: asset.status,
      duration: asset.duration,
      hasTranscript: asset.status === "ready",
      hint: "POST to this endpoint with assetId to generate chapters",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve asset" },
      { status: 500 }
    );
  }
}
