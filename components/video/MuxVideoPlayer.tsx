"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface MuxVideoPlayerProps {
  playbackId: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  startTime?: number;
  // Mux Data analytics metadata
  metadata?: {
    video_title?: string;
    video_id?: string;
    viewer_user_id?: string;
    // Custom dimensions for ClimateIQ
    climate_topic?: string;
    user_region?: string;
    feature_used?: string;
  };
  // Styling
  className?: string;
  aspectRatio?: string;
  // Event handlers
  onEnded?: () => void;
  onError?: (error: Error) => void;
  onLoadedData?: () => void;
}

/**
 * MuxVideoPlayer - A wrapper around MuxPlayer with ClimateIQ branding
 * and analytics integration
 */
export function MuxVideoPlayer({
  playbackId,
  title,
  poster,
  autoPlay = false,
  muted = false,
  loop = false,
  startTime,
  metadata,
  className = "",
  aspectRatio = "16/9",
  onEnded,
  onError,
  onLoadedData,
}: MuxVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset loading state when playbackId changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [playbackId]);

  const handleLoadedData = () => {
    setIsLoading(false);
    onLoadedData?.();
  };

  const handleError = (error: unknown) => {
    setIsLoading(false);
    setHasError(true);
    console.error("Mux Player error:", error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
  };

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
        style={{ aspectRatio }}
      >
        <div className="text-center p-4">
          <p className="text-gray-500 dark:text-gray-400">
            Failed to load video
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="mt-2 text-sm text-blue-500 hover:text-blue-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ aspectRatio }}>
      {isLoading && (
        <Skeleton className="absolute inset-0 rounded-lg" />
      )}
      <MuxPlayer
        playbackId={playbackId}
        title={title}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        startTime={startTime}
        streamType="on-demand"
        // Enable storyboard previews on timeline hover
        thumbnailTime={0}
        // Mux Data analytics
        metadata={{
          video_title: metadata?.video_title || title,
          video_id: metadata?.video_id || playbackId,
          viewer_user_id: metadata?.viewer_user_id,
          // Custom dimensions for ClimateIQ
          custom_1: metadata?.climate_topic,
          custom_2: metadata?.user_region,
          custom_3: metadata?.feature_used,
        }}
        // Styling
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "0.5rem",
          aspectRatio,
          // Show controls
          "--controls": "flex",
          // ClimateIQ theme colors
          "--primary-color": "#22c55e",
          "--secondary-color": "#16a34a",
        } as Record<string, string>}
        // Events
        onLoadedData={handleLoadedData}
        onError={handleError}
        onEnded={onEnded}
      />
    </div>
  );
}

/**
 * MuxLivePlayer - Player optimized for live streams
 */
interface MuxLivePlayerProps extends Omit<MuxVideoPlayerProps, "autoPlay" | "loop" | "startTime"> {
  lowLatency?: boolean;
}

export function MuxLivePlayer({
  playbackId,
  title,
  lowLatency = true,
  metadata,
  className = "",
  aspectRatio = "16/9",
  onError,
  onLoadedData,
}: MuxLivePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${className}`} style={{ aspectRatio }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="text-gray-600 dark:text-gray-400">
                Connecting to live stream...
              </span>
            </div>
          </div>
        </div>
      )}
      <MuxPlayer
        playbackId={playbackId}
        title={title}
        streamType="live"
        autoPlay
        muted
        // Low latency mode for reduced delay
        targetLiveWindow={lowLatency ? 5 : undefined}
        // Mux Data analytics
        metadata={{
          video_title: metadata?.video_title || title,
          video_id: metadata?.video_id || playbackId,
          viewer_user_id: metadata?.viewer_user_id,
          custom_1: metadata?.climate_topic,
          custom_2: metadata?.user_region,
          custom_3: metadata?.feature_used,
        }}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "0.5rem",
          aspectRatio,
          "--primary-color": "#22c55e",
          "--secondary-color": "#16a34a",
        } as Record<string, string>}
        onLoadedData={() => {
          setIsLoading(false);
          onLoadedData?.();
        }}
        onError={(e) => {
          setIsLoading(false);
          console.error("Mux Live Player error:", e);
          onError?.(e instanceof Error ? e : new Error(String(e)));
        }}
      />
      {/* Live indicator */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        LIVE
      </div>
    </div>
  );
}

export default MuxVideoPlayer;
