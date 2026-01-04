import { NextRequest, NextResponse } from "next/server";
import { muxVideo } from "@/lib/mux";

/**
 * POST /api/mux/live-stream
 * Create a new live stream for farmer broadcasts
 */
export async function POST(request: NextRequest) {
  try {
    // Parse optional request body
    let body: {
      passthrough?: string;
      reducedLatency?: boolean;
      reconnectWindow?: number;
    } = {};

    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    // Create live stream with low latency for real-time interaction
    const liveStream = await muxVideo.liveStreams.create({
      playback_policy: ["public"],
      // Enable reduced latency for 5-second delay (great for farmer broadcasts)
      reduced_latency: body.reducedLatency !== false,
      // Allow 60 seconds to reconnect if stream drops
      reconnect_window: body.reconnectWindow || 60,
      // Auto-generate captions for the live stream
      generated_subtitles: [
        {
          language_code: "en",
          name: "English (auto)",
          transcription_vocabulary_ids: [],
        },
      ],
      // Create a recording of the live stream as VOD
      new_asset_settings: {
        playback_policy: ["public"],
      },
      // Pass through metadata (must be at top level, NOT in new_asset_settings)
      passthrough: body.passthrough || undefined,
    });

    return NextResponse.json({
      id: liveStream.id,
      streamKey: liveStream.stream_key,
      playbackId: liveStream.playback_ids?.[0]?.id,
      status: liveStream.status,
      // RTMP ingest URL
      rtmpUrl: "rtmps://global-live.mux.com:443/app",
    });
  } catch (error) {
    console.error("Error creating live stream:", error);

    return NextResponse.json(
      {
        error: "Failed to create live stream",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mux/live-stream?id=xxx
 * Get live stream details
 */
export async function GET(request: NextRequest) {
  try {
    const streamId = request.nextUrl.searchParams.get("id");

    if (!streamId) {
      return NextResponse.json(
        { error: "Stream ID is required" },
        { status: 400 }
      );
    }

    const liveStream = await muxVideo.liveStreams.retrieve(streamId);

    return NextResponse.json({
      id: liveStream.id,
      streamKey: liveStream.stream_key,
      playbackId: liveStream.playback_ids?.[0]?.id,
      status: liveStream.status,
      activeAssetId: liveStream.active_asset_id,
      recentAssetIds: liveStream.recent_asset_ids,
    });
  } catch (error) {
    console.error("Error retrieving live stream:", error);

    return NextResponse.json(
      {
        error: "Failed to retrieve live stream",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mux/live-stream?id=xxx
 * Delete a live stream
 */
export async function DELETE(request: NextRequest) {
  try {
    const streamId = request.nextUrl.searchParams.get("id");

    if (!streamId) {
      return NextResponse.json(
        { error: "Stream ID is required" },
        { status: 400 }
      );
    }

    await muxVideo.liveStreams.delete(streamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting live stream:", error);

    return NextResponse.json(
      {
        error: "Failed to delete live stream",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
