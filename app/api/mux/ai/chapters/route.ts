import { NextRequest, NextResponse } from "next/server";
import { generateChapters } from "@mux/ai/workflows";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/mux/ai/chapters
 * Generate AI chapters for a video using official @mux/ai library
 * 
 * This is the PRODUCTION-LEVEL implementation using Mux's official
 * open-source AI toolkit that handles:
 * - Transcript fetching from Mux
 * - Prompt engineering for chapter generation
 * - LLM response parsing with retries
 * - Error handling and edge cases
 * - Database persistence (Supabase)
 * 
 * Request body:
 * - assetId: Mux asset ID
 * - provider: 'google' | 'openai' | 'anthropic' (default: 'google')
 * 
 * Response:
 * - chapters: Array of { startTime, value (title) }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, provider = "google" } = body;

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ["google", "openai", "anthropic"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Use: ${validProviders.join(", ")}` },
        { status: 400 }
      );
    }

    console.log(`Generating chapters for ${assetId} using @mux/ai (${provider})`);

    // Use official @mux/ai generateChapters workflow
    // This handles transcript fetching, prompt engineering, and LLM parsing
    const result = await generateChapters(assetId, "en", {
      provider: provider as "google" | "openai" | "anthropic",
    });

    // Transform response to match our expected format
    // @mux/ai returns { startTime, value } format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chapters = result.chapters.map((chapter: any) => ({
      startTime: chapter.startTime,
      endTime: chapter.endTime ?? chapter.startTime + 60,
      value: chapter.value || chapter.title,
    }));

    // Store chapters in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { error: updateError } = await supabase
        .from("climate_videos")
        .update({ chapters: chapters })
        .eq("mux_asset_id", assetId);

      if (updateError) {
        console.error("Error storing chapters in Supabase:", updateError);
        // We continue nicely even if storage fails, but log it
      } else {
        console.log(`Stored ${chapters.length} chapters for ${assetId} in Supabase`);
      }
    } else {
      console.warn("Supabase credentials missing, skipping DB storage");
    }

    return NextResponse.json({
      assetId,
      chapters,
      provider,
      totalChapters: chapters.length,
      source: "@mux/ai official library",
    });
  } catch (error) {
    console.error("Error generating chapters:", error);
    
    // Provide helpful error messages
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Check for common issues
    if (errorMessage.includes("transcript") || errorMessage.includes("captions")) {
      return NextResponse.json(
        { 
          error: "Captions not available for this video.",
          hint: "Ensure auto-captions are enabled. Wait 3-5 minutes after upload for captions to generate.",
          details: errorMessage
        },
        { status: 400 }
      );
    }
    
    if (errorMessage.includes("API key") || errorMessage.includes("credential")) {
      return NextResponse.json(
        { 
          error: "AI provider credentials not configured.",
          hint: "Add GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY to .env.local",
          details: errorMessage
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to generate chapters",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
