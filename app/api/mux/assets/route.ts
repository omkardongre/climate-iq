import { NextRequest, NextResponse } from "next/server";
import { muxVideo } from "@/lib/mux";

/**
 * GET /api/mux/assets?id=xxx
 * Get asset details by asset ID
 */
export async function GET(request: NextRequest) {
  try {
    const assetId = request.nextUrl.searchParams.get("id");

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }

    const asset = await muxVideo.assets.retrieve(assetId);

    // Get the public playback ID
    const playbackId = asset.playback_ids?.find(
      (p) => p.policy === "public"
    )?.id;

    return NextResponse.json({
      id: asset.id,
      status: asset.status,
      playbackId,
      duration: asset.duration,
      aspectRatio: asset.aspect_ratio,
      createdAt: asset.created_at,
      tracks: asset.tracks,
      // Include caption track info if available
      captions: asset.tracks?.filter((t) => t.type === "text"),
    });
  } catch (error) {
    console.error("Error retrieving asset:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve asset",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mux/assets?id=xxx
 * Delete an asset
 */
export async function DELETE(request: NextRequest) {
  try {
    const assetId = request.nextUrl.searchParams.get("id");

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }

    await muxVideo.assets.delete(assetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);

    return NextResponse.json(
      {
        error: "Failed to delete asset",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
