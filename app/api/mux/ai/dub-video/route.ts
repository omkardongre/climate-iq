import { NextRequest, NextResponse } from "next/server";
import { muxVideo } from "@/lib/mux";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

/**
 * POST /api/mux/ai/dub-video
 * Initiate AI Dubbing for a Mux Video
 */
export async function POST(request: NextRequest) {
  try {
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "Missing ELEVENLABS_API_KEY configuration" },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("[Dubbing] Request Body:", body);
    const { assetId, playbackId, targetLanguage, sourceLanguage = "auto" } = body;

    if (!assetId || !playbackId || !targetLanguage) {
      console.error("[Dubbing] Missing required fields:", { assetId, playbackId, targetLanguage });
      return NextResponse.json(
        { error: "Missing required fields (assetId, playbackId, targetLanguage)" },
        { status: 400 }
      );
    }

    // 1. Get Source URL from Mux (MP4 or Master)
    // We try to get a static rendition (MP4) first as it's faster/smaller than master
    let sourceUrl = "";
    
    const asset = await muxVideo.assets.retrieve(assetId);
    
    // Check for existing static renditions (MP4)
    const mp4Rendition = asset.static_renditions?.files?.find(f => f.ext === 'mp4');
    
    if (mp4Rendition) {
      // Construct URL: https://stream.mux.com/{playbackId}/{filename} ? 
      // Actually static renditions usually don't have public URLs unless we use the playback ID and specific filename convention?
      // Or Mux provides 'url'? No, usually it's download URL.
      // Easiest hack: use low.mp4 if mp4_support is standard.
      // https://stream.mux.com/{playbackId}/low.mp4
      
      // Let's verify mp4_support
      if (asset.mp4_support === 'standard') {
         sourceUrl = `https://stream.mux.com/${playbackId}/low.mp4`;
      }
    }

    // If no MP4 support, try Master Access
    if (!sourceUrl) {
       // Check if master access is already enabled
       const currentAsset = await muxVideo.assets.retrieve(assetId);
       
       if (currentAsset.master?.status !== 'ready') {
          try {
            // Enable temporary master access
            await muxVideo.assets.updateMasterAccess(assetId, { master_access: 'temporary' });
          } catch (muxErr: any) {
             // Ignore "Download already exists" error if it happens
             if (muxErr?.body?.error?.type === 'invalid_parameters' || 
                 muxErr?.message?.includes('already exists')) {
                 console.log("[Dubbing] Master access likely already enabled/processing");
             } else {
                 throw muxErr;
             }
          }
       }
       
       // Retrieve again to get the signed URL
       // Wait a brief moment if we just enabled it? 
       // Usually the URL is available immediately on 'temporary' update return or next fetch?
       // Let's fetch again.
       const updatedAsset = await muxVideo.assets.retrieve(assetId);
       sourceUrl = updatedAsset.master?.url || "";
    }

    if (!sourceUrl) {
        // Fallback: Use High-HLS? (ElevenLabs might accept it)
        sourceUrl = `https://stream.mux.com/${playbackId}.m3u8`;
        console.log("[Dubbing] Using HLS URL as fallback:", sourceUrl);
    }

    console.log(`[Dubbing] Source URL: ${sourceUrl}`);

    // 2. Call ElevenLabs API using FormData (multipart/form-data - REQUIRED by API)
    const formData = new FormData();
    formData.append("name", `ClimateIQ Dub - ${assetId} - ${targetLanguage}`);
    formData.append("source_url", sourceUrl);
    formData.append("target_lang", targetLanguage);
    formData.append("source_lang", sourceLanguage); // "auto"
    formData.append("mode", "automatic");
    formData.append("watermark", "true");
    
    console.log(`[Dubbing] Sending to ElevenLabs: target_lang=${targetLanguage}, source_url=${sourceUrl}`);

    const elevenLabsResponse = await fetch("https://api.elevenlabs.io/v1/dubbing", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        // Do NOT set Content-Type manually - fetch will set it correctly for FormData
      },
      body: formData,
    });

    if (!elevenLabsResponse.ok) {
        const errorText = await elevenLabsResponse.text();
        console.error("ElevenLabs Error:", errorText);
        
        let errorMessage = `ElevenLabs API Error: ${elevenLabsResponse.status}`;
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.detail?.status === 'missing_permissions') {
                errorMessage = "ElevenLabs API Key missing 'dubbing_write' permission. Please upgrade your plan.";
            } else if (errorJson.detail?.message) {
                errorMessage = `ElevenLabs: ${errorJson.detail.message}`;
            }
        } catch (e) {
            // keep default
        }
        
        return NextResponse.json({ error: errorMessage }, { status: 403 });
    }

    const dubbingData = await elevenLabsResponse.json();
    const dubbingId = dubbingData.dubbing_id;

    console.log(`[Dubbing] Started job ${dubbingId} for asset ${assetId}`);

    return NextResponse.json({
      success: true,
      dubbingId: dubbingId,
      status: "dubbing" // ElevenLabs status
    });

  } catch (error) {
    console.error("[Dubbing] API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
