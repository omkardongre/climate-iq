import { NextRequest, NextResponse } from "next/server";
import { muxVideo } from "@/lib/mux";

/**
 * POST /api/mux/upload-url
 * Creates a direct upload URL for client-side video uploads
 * 
 * Request body:
 * - corsOrigin: (optional) origin for CORS, defaults to request origin
 * - newAssetSettings: (optional) settings for the created asset
 * 
 * Response:
 * - uploadId: unique ID for this upload
 * - uploadUrl: signed URL for direct upload
 */
export async function POST(request: NextRequest) {
  try {
    // Get the origin for CORS
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Parse optional request body
    let body: {
      corsOrigin?: string;
      passthrough?: string;
      videoQuality?: "basic" | "plus";
    } = {};
    
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    // Create direct upload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upload = await muxVideo.uploads.create({
      cors_origin: body.corsOrigin || origin,
      new_asset_settings: {
        playback_policy: ["public"],
        // Pass through metadata if provided
        passthrough: body.passthrough || undefined,
        // Video quality setting
        video_quality: body.videoQuality || "plus",
        // Auto-generate captions using Whisper (CRITICAL for accessibility)
        generated_subtitles: [
          {
            language_code: "en",
            name: "English (auto)",
          },
        ],
      } as Record<string, unknown>,
    });

    return NextResponse.json({
      uploadId: upload.id,
      uploadUrl: upload.url,
    });
  } catch (error) {
    console.error("Error creating Mux upload URL:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to create upload URL",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mux/upload-url?id=xxx
 * Check the status of an upload
 */
export async function GET(request: NextRequest) {
  try {
    const uploadId = request.nextUrl.searchParams.get("id");

    if (!uploadId) {
      return NextResponse.json(
        { error: "Upload ID is required" },
        { status: 400 }
      );
    }

    const upload = await muxVideo.uploads.retrieve(uploadId);

    return NextResponse.json({
      id: upload.id,
      status: upload.status,
      assetId: upload.asset_id,
    });
  } catch (error) {
    console.error("Error retrieving upload status:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to retrieve upload status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
