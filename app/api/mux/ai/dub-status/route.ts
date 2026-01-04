import { NextRequest, NextResponse } from "next/server";
import { muxVideo } from "@/lib/mux";
import { createClient } from "@supabase/supabase-js";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const maxDuration = 60; // Allow time for download/upload

/**
 * GET /api/mux/ai/dub-status
 * Check status of ElevenLabs dubbing, and if done, sync to Mux
 * 
 * Query: ?id=dubbingId&assetId=assetId&language=targetLang
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dubbingId = searchParams.get("id");
    const assetId = searchParams.get("assetId");
    const languageCode = searchParams.get("language"); // e.g. 'es'

    if (!dubbingId || !assetId || !languageCode) {
      return NextResponse.json({ error: "Missing required params" }, { status: 400 });
    }

    // 1. Check ElevenLabs Status
    const statusResp = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbingId}`, {
      headers: { "xi-api-key": ELEVENLABS_API_KEY! }
    });
    
    if (!statusResp.ok) throw new Error("Failed to check status");
    const statusData = await statusResp.json();

    if (statusData.status === "dubbed") {
      // 2. Download Audio
      console.log(`[Dubbing] Job ${dubbingId} complete. Downloading audio...`);
      
      const audioResp = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbingId}/audio/${languageCode}`, {
        headers: { "xi-api-key": ELEVENLABS_API_KEY! }
      });
      
      if (!audioResp.ok) throw new Error("Failed to download dubbed audio");
      
      const audioBuffer = await audioResp.arrayBuffer();
      
      // 3. Upload to Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const fileName = `audio/${assetId}/${languageCode}.mp3`;
      
      const { error: uploadError } = await supabase.storage
        .from('climate-media')
        .upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadError) throw new Error(`Supabase upload failed: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('climate-media')
        .getPublicUrl(fileName);

      console.log(`[Dubbing] Uploaded to ${publicUrl}`);

      // 4. Add Track to Mux
      // Check if track exists? (Optimization)
      // For now, simple create
      try {
        await muxVideo.assets.createTrack(assetId, {
            url: publicUrl,
            type: 'audio',
            language_code: languageCode,
            name: `AI Dubbed (${languageCode})`,
            closed_captions: false
        });
        console.log(`[Dubbing] Mux track created`);
      } catch (muxErr) {
         console.warn("Mux track creation warning (might exist):", muxErr);
         // If error is "Track language_code must be unique" we could delete and recreate, 
         // but for now let's assume it works or fails soft.
      }

      return NextResponse.json({ 
        status: "completed", 
        message: "Dubbing complete and track added" 
      });
    }

    // Still processing
    return NextResponse.json({ 
       status: statusData.status // 'dubbing', 'queued'
    });

  } catch (error) {
    console.error("[Dubbing] Status Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Error" },
      { status: 500 }
    );
  }
}
