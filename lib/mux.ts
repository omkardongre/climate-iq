import Mux from "@mux/mux-node";

// Initialize Mux client with environment variables
// These should be set in .env.local:
// MUX_TOKEN_ID=your_token_id
// MUX_TOKEN_SECRET=your_token_secret

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  console.warn(
    "Warning: MUX_TOKEN_ID or MUX_TOKEN_SECRET not found in environment variables"
  );
}

// Create Mux client instance
export const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Export commonly used services
export const { video: muxVideo } = muxClient;

// Helper function to generate a thumbnail URL from a playback ID
export function getThumbnailUrl(
  playbackId: string,
  options?: {
    width?: number;
    height?: number;
    time?: number;
    format?: "jpg" | "png" | "webp" | "gif";
    fitMode?: "preserve" | "stretch" | "crop" | "smartcrop" | "pad";
  }
): string {
  const params = new URLSearchParams();

  if (options?.width) params.append("width", options.width.toString());
  if (options?.height) params.append("height", options.height.toString());
  if (options?.time) params.append("time", options.time.toString());
  if (options?.fitMode) params.append("fit_mode", options.fitMode);

  const format = options?.format || "jpg";
  const queryString = params.toString();

  return `https://image.mux.com/${playbackId}/thumbnail.${format}${queryString ? `?${queryString}` : ""}`;
}

// Helper function to generate an animated GIF URL from a playback ID
export function getAnimatedGifUrl(
  playbackId: string,
  options?: {
    width?: number;
    height?: number;
    start?: number;
    end?: number;
    fps?: number;
  }
): string {
  const params = new URLSearchParams();

  if (options?.width) params.append("width", options.width.toString());
  if (options?.height) params.append("height", options.height.toString());
  if (options?.start) params.append("start", options.start.toString());
  if (options?.end) params.append("end", options.end.toString());
  if (options?.fps) params.append("fps", options.fps.toString());

  const queryString = params.toString();

  return `https://image.mux.com/${playbackId}/animated.gif${queryString ? `?${queryString}` : ""}`;
}

// Helper function to generate storyboard URL
export function getStoryboardUrl(
  playbackId: string,
  format: "jpg" | "png" | "webp" = "webp"
): string {
  return `https://image.mux.com/${playbackId}/storyboard.${format}`;
}

// Helper function to get HLS stream URL
export function getStreamUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

// Helper function to get poster image URL
export function getPosterUrl(playbackId: string, time: number = 0): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`;
}

// Types for Mux assets
export interface MuxAsset {
  id: string;
  playbackId: string;
  status: "preparing" | "ready" | "errored";
  duration?: number;
  aspectRatio?: string;
  createdAt: string;
}

// Type for direct upload response
export interface DirectUploadResponse {
  uploadId: string;
  uploadUrl: string;
}

// Type for live stream
export interface LiveStreamResponse {
  id: string;
  streamKey: string;
  playbackId: string;
  status: "idle" | "active" | "disabled";
}
