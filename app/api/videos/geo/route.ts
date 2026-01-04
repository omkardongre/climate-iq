import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/videos/geo
 * Fetch videos within geographic bounds for map display
 * 
 * Query params:
 * - north, south, east, west: bounding box coordinates
 * - limit: maximum number of videos (default 50)
 * - topic: optional climate topic filter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    const north = parseFloat(searchParams.get("north") || "90");
    const south = parseFloat(searchParams.get("south") || "-90");
    const east = parseFloat(searchParams.get("east") || "180");
    const west = parseFloat(searchParams.get("west") || "-180");
    const limit = parseInt(searchParams.get("limit") || "50");
    const topic = searchParams.get("topic");

    // Build query
    let query = supabase
      .from("climate_videos")
      .select("id, playback_id, title, description, latitude, longitude, location_name, climate_topic, duration, view_count, created_at")
      .eq("status", "ready")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .gte("latitude", south)
      .lte("latitude", north)
      .gte("longitude", west)
      .lte("longitude", east)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply topic filter if provided
    if (topic) {
      query = query.eq("climate_topic", topic);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching geo videos:", error);
      return NextResponse.json(
        { error: "Failed to fetch videos" },
        { status: 500 }
      );
    }

    // Transform to expected format
    const videos = (data || []).map((video) => ({
      id: video.id,
      playbackId: video.playback_id,
      title: video.title,
      description: video.description,
      latitude: video.latitude,
      longitude: video.longitude,
      locationName: video.location_name,
      climateTopic: video.climate_topic,
      duration: video.duration,
      viewCount: video.view_count,
      createdAt: video.created_at,
    }));

    return NextResponse.json({ videos, count: videos.length });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
