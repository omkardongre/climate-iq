import { NextRequest, NextResponse } from "next/server";
import { muxVideo } from "@/lib/mux";
import { SUPPORTED_LANGUAGES } from "@/lib/ai-config";

/**
 * POST /api/mux/audio-tracks
 * Add an audio track to a Mux asset (for multi-language support)
 * 
 * Request body:
 * - assetId: Mux asset ID  
 * - audioUrl: Public URL of the audio file (M4A, WAV, or MP3)
 * - languageCode: ISO 639-1 language code
 * - name: Optional display name for the track
 * 
 * Response:
 * - trackId: ID of the new audio track
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, audioUrl, languageCode, name } = body;

    if (!assetId || !audioUrl || !languageCode) {
      return NextResponse.json(
        { error: "assetId, audioUrl, and languageCode are required" },
        { status: 400 }
      );
    }

    // Validate language code
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    const trackName = name || langConfig?.name || languageCode.toUpperCase();

    // Verify the asset exists and is ready
    const asset = await muxVideo.assets.retrieve(assetId);
    if (asset.status !== "ready") {
      return NextResponse.json(
        { error: "Asset must be in 'ready' state to add audio tracks" },
        { status: 400 }
      );
    }

    // Add the audio track to the asset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const track = await (muxVideo.assets as any).createTrack(assetId, {
      type: "audio",
      url: audioUrl,
      language_code: languageCode,
      name: trackName,
    });

    return NextResponse.json({
      success: true,
      assetId,
      trackId: track.id,
      languageCode,
      name: trackName,
      status: track.status,
      message: `Audio track "${trackName}" added successfully`,
    });
  } catch (error) {
    console.error("Error adding audio track:", error);
    return NextResponse.json(
      { 
        error: "Failed to add audio track",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mux/audio-tracks?assetId=xxx
 * List all audio tracks for an asset
 */
export async function GET(request: NextRequest) {
  try {
    const assetId = request.nextUrl.searchParams.get("assetId");

    if (!assetId) {
      // Return supported audio formats
      return NextResponse.json({
        supportedFormats: ["M4A", "WAV", "MP3"],
        supportedLanguages: SUPPORTED_LANGUAGES,
        usage: "POST with { assetId, audioUrl, languageCode, name? }",
      });
    }

    // Get asset and its tracks
    const asset = await muxVideo.assets.retrieve(assetId);

    // Filter for audio tracks
    const audioTracks = (asset.tracks || []).filter(
      (track) => track.type === "audio"
    );

    return NextResponse.json({
      assetId,
      audioTracks: audioTracks.map((track) => ({
        id: track.id,
        type: track.type,
        languageCode: track.language_code,
        name: track.name,
        status: track.status,
        primary: track.primary,
      })),
      totalTracks: audioTracks.length,
    });
  } catch (error) {
    console.error("Error listing audio tracks:", error);
    return NextResponse.json(
      { 
        error: "Failed to list audio tracks",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mux/audio-tracks?assetId=xxx&trackId=xxx
 * Remove an audio track from an asset
 */
export async function DELETE(request: NextRequest) {
  try {
    const assetId = request.nextUrl.searchParams.get("assetId");
    const trackId = request.nextUrl.searchParams.get("trackId");

    if (!assetId || !trackId) {
      return NextResponse.json(
        { error: "assetId and trackId are required" },
        { status: 400 }
      );
    }

    // Delete the track
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (muxVideo.assets as any).deleteTrack(assetId, trackId);

    return NextResponse.json({
      success: true,
      message: "Audio track deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting audio track:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete audio track",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
