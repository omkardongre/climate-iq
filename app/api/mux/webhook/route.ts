import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify Mux webhook signature
 * @see https://docs.mux.com/guides/listen-for-webhooks#verify-webhook-signatures
 */
function verifyMuxSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined
): { valid: boolean; error?: string } {
  // Skip verification in development if no secret is configured
  if (!secret) {
    console.warn("MUX_WEBHOOK_SECRET not configured - skipping signature verification");
    return { valid: true };
  }

  if (!signatureHeader) {
    return { valid: false, error: "Missing Mux-Signature header" };
  }

  // Parse the signature header: t=timestamp,v1=signature
  const parts = signatureHeader.split(",");
  const timestampPart = parts.find(p => p.startsWith("t="));
  const signaturePart = parts.find(p => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) {
    return { valid: false, error: "Invalid Mux-Signature format" };
  }

  const timestamp = timestampPart.slice(2);
  const signature = signaturePart.slice(3);

  // Check timestamp tolerance (5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp, 10);
  const tolerance = 5 * 60; // 5 minutes

  if (Math.abs(currentTime - webhookTime) > tolerance) {
    return { valid: false, error: "Webhook timestamp too old" };
  }

  // Compute expected signature: HMAC-SHA256(timestamp.rawBody)
  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Use timing-safe comparison
  try {
    const isValid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    return { valid: isValid };
  } catch {
    return { valid: false, error: "Signature mismatch" };
  }
}

/**
 * POST /api/mux/webhook
 * Handle Mux webhook events
 * 
 * Events handled:
 * - video.asset.ready: Asset is ready for playback
 * - video.asset.errored: Asset processing failed
 * - video.live_stream.active: Live stream started
 * - video.live_stream.idle: Live stream ended
 * - video.live_stream.recording: Recording complete
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const signatureHeader = request.headers.get("mux-signature");
    const verification = verifyMuxSignature(
      rawBody,
      signatureHeader,
      process.env.MUX_WEBHOOK_SECRET
    );

    if (!verification.valid) {
      console.error("Webhook signature verification failed:", verification.error);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse the verified body
    const body = JSON.parse(rawBody);
    const eventType = body.type;
    const data = body.data;

    console.log(`Mux webhook received: ${eventType}`);

    switch (eventType) {
      case "video.asset.ready": {
        // Asset is ready for playback
        const assetId = data.id;
        const playbackId = data.playback_ids?.[0]?.id;
        const duration = data.duration;
        const aspectRatio = data.aspect_ratio;
        const passthrough = data.passthrough;

        if (playbackId) {
          // Update the video record in Supabase
          const { error } = await supabaseAdmin
            .from("climate_videos")
            .update({
              status: "ready",
              playback_id: playbackId,
              duration,
              aspect_ratio: aspectRatio,
              updated_at: new Date().toISOString(),
            })
            .eq("mux_asset_id", assetId);

          if (error) {
            console.error("Error updating video record:", error);
          } else {
            console.log(`Video asset ${assetId} is ready with playback ID ${playbackId}`);
          }
        }
        break;
      }

      case "video.asset.errored": {
        // Asset processing failed
        const assetId = data.id;
        const errorMessage = data.errors?.messages?.[0] || "Unknown error";

        const { error } = await supabaseAdmin
          .from("climate_videos")
          .update({
            status: "error",
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq("mux_asset_id", assetId);

        if (error) {
          console.error("Error updating video record:", error);
        } else {
          console.log(`Video asset ${assetId} errored: ${errorMessage}`);
        }
        break;
      }

      case "video.live_stream.active": {
        // Live stream has started
        const streamId = data.id;
        const playbackId = data.playback_ids?.[0]?.id;

        const { error } = await supabaseAdmin
          .from("live_streams")
          .update({
            status: "active",
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("mux_stream_id", streamId);

        if (error) {
          console.error("Error updating stream record:", error);
        } else {
          console.log(`Live stream ${streamId} is now active`);
        }
        break;
      }

      case "video.live_stream.idle": {
        // Live stream has ended
        const streamId = data.id;

        const { error } = await supabaseAdmin
          .from("live_streams")
          .update({
            status: "idle",
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("mux_stream_id", streamId);

        if (error) {
          console.error("Error updating stream record:", error);
        } else {
          console.log(`Live stream ${streamId} is now idle`);
        }
        break;
      }

      case "video.live_stream.recording": {
        // Live stream recording is complete
        const streamId = data.id;
        const assetId = data.asset_id;

        if (assetId) {
          // Link the recording to the live stream
          const { error } = await supabaseAdmin
            .from("live_streams")
            .update({
              recording_asset_id: assetId,
              updated_at: new Date().toISOString(),
            })
            .eq("mux_stream_id", streamId);

          if (error) {
            console.error("Error updating stream record:", error);
          } else {
            console.log(`Live stream ${streamId} recording saved as asset ${assetId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
