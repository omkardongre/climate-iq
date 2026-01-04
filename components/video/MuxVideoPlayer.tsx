import MuxPlayer from "@mux/mux-player-react";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Chapter {
  startTime: number;
  endTime?: number;
  value: string;
}

interface MuxVideoPlayerProps {
  playbackId: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  startTime?: number;
  // Chapters for navigation - displayed via WebVTT track in player UI
  chapters?: Chapter[];
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
 * Formats seconds to WebVTT timestamp format: HH:MM:SS.mmm
 */
function formatVttTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * MuxVideoPlayer - A wrapper around MuxPlayer with ClimateIQ branding
 * and analytics integration. Uses WebVTT track for chapter navigation.
 * 
 * Chapters are displayed in the player's chapter menu and timeline markers
 * via the standard HTML5 <track kind="chapters"> element.
 */
export function MuxVideoPlayer({
  playbackId,
  title,
  poster,
  autoPlay = false,
  muted = false,
  loop = false,
  startTime,
  chapters,
  metadata,
  className = "",
  aspectRatio = "16/9",
  onEnded,
  onError,
  onLoadedData,
}: MuxVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isChaptersExpanded, setIsChaptersExpanded] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    onLoadedData?.();
  }, [onLoadedData]);

  const handleError = useCallback((error: unknown) => {
    setIsLoading(false);
    setHasError(true);
    console.error("Mux Player error:", error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }, [onError]);

  // Handle seeking to chapter
  const seekToChapter = (time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time;
      // Also ensure it plays if paused
      if (playerRef.current.paused) {
        playerRef.current.play().catch(console.error);
      }
    }
  };

  // Optional: Track current time to highlight active chapter
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onTimeUpdate = (e: Event) => {
      // @ts-ignore
      setCurrentTime(e.target.currentTime);
    };

    player.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      player.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [isLoading]); 

  // Determine active chapter index
  const activeChapterIndex = useMemo(() => {
    if (!chapters) return -1;
    // Find the last chapter that started before current time
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentTime >= chapters[i].startTime) {
        return i;
      }
    }
    return -1;
  }, [chapters, currentTime]);

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
    <div className={className}>
      <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio }}>
        {isLoading && (
          <Skeleton className="absolute inset-0 rounded-lg" />
        )}
        <MuxPlayer
          ref={playerRef}
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

      {/* Custom Chapter List UI */}
      {chapters && chapters.length > 0 && (
        <div className="mt-4 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-black">
          <button 
            onClick={() => setIsChaptersExpanded(!isChaptersExpanded)}
            className="w-full bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Video Chapters
              </h3>
              <span className="text-xs text-gray-500 font-normal px-2 py-0.5 bg-gray-200 dark:bg-gray-800 rounded-full">
                {chapters.length}
              </span>
            </div>
            <div className={`transform transition-transform duration-200 ${isChaptersExpanded ? 'rotate-180' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
          
          {isChaptersExpanded && (
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {chapters.map((chapter, index) => {
                const isActive = index === activeChapterIndex;
                // Format time MM:SS
                const mins = Math.floor(chapter.startTime / 60);
                const secs = Math.floor(chapter.startTime % 60);
                const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

                return (
                  <button
                    key={index}
                    onClick={() => seekToChapter(chapter.startTime)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-3 text-sm group ${
                      isActive 
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium border border-green-100 dark:border-green-900/30" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                    }`}>
                      {timeStr}
                    </span>
                    <span className="truncate flex-1">
                      {chapter.value}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * MuxLivePlayer - Player optimized for live streams
 */
interface MuxLivePlayerProps extends Omit<MuxVideoPlayerProps, "autoPlay" | "loop" | "startTime" | "chapters"> {
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
