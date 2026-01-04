"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { getThumbnailUrl, getAnimatedGifUrl } from "@/lib/mux";
import { MapPin, Eye, Clock, Play } from "lucide-react";
import Image from "next/image";

// Types
interface VideoPin {
  id: string;
  playbackId: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  climateTopic?: string;
  duration?: number;
  viewCount?: number;
  createdAt: string;
}

interface VideoMapPinProps {
  video: VideoPin;
  isSelected?: boolean;
  onSelect?: (video: VideoPin) => void;
}

/**
 * VideoMapPin - A map marker component for geo-located videos
 * Shows thumbnail on hover, animated GIF preview, and opens player modal on click
 */
export function VideoMapPin({ video, isSelected, onSelect }: VideoMapPinProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get appropriate image URL based on hover state
  const imageUrl = isHovered
    ? getAnimatedGifUrl(video.playbackId, { width: 160, height: 90, fps: 8, start: 0, end: 2 })
    : getThumbnailUrl(video.playbackId, { width: 160, height: 90, time: 1 });

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Map Marker */}
      <div
        className={`
          relative cursor-pointer transition-all duration-200 transform
          ${isSelected ? "z-50 scale-110" : "z-10 hover:z-40 hover:scale-105"}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          onSelect?.(video);
          setIsModalOpen(true);
        }}
      >
        {/* Pin Icon */}
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            shadow-lg border-2 border-white
            ${isSelected ? "bg-green-600" : "bg-blue-600"}
            ${isHovered ? "ring-4 ring-blue-200" : ""}
          `}
        >
          <Play className="w-5 h-5 text-white ml-0.5" />
        </div>

        {/* Hover Preview Card */}
        {isHovered && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50"
            style={{ minWidth: "200px" }}
          >
            {/* Thumbnail/GIF */}
            <div className="relative aspect-video w-full">
              <Image
                src={imageUrl}
                alt={video.title}
                fill
                className="object-cover"
                unoptimized
              />
              {video.duration && (
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </span>
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-4 h-4 text-green-600 ml-0.5" />
                </div>
              </div>
            </div>
            
            {/* Info */}
            <div className="p-2">
              <h4 className="font-medium text-sm line-clamp-1 text-gray-900 dark:text-white">
                {video.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                {video.locationName && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {video.locationName}
                  </span>
                )}
                {video.viewCount !== undefined && (
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    {video.viewCount}
                  </span>
                )}
              </div>
            </div>
            
            {/* Arrow pointing down */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800" />
          </div>
        )}
      </div>

      {/* Video Playback Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
          <MuxVideoPlayer
            playbackId={video.playbackId}
            title={video.title}
            aspectRatio="16/9"
            autoPlay
            metadata={{
              video_title: video.title,
              video_id: video.id,
              climate_topic: video.climateTopic,
              user_region: video.locationName,
              feature_used: "map_video_pins",
            }}
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{video.title}</h3>
            {video.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                {video.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-sm">
              {video.climateTopic && (
                <Badge variant="secondary">{video.climateTopic}</Badge>
              )}
              {video.locationName && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {video.locationName}
                </Badge>
              )}
              <span className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(video.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * VideoMapLayer - Hook to fetch geo-located videos for the map
 */
export function useVideoMapPins() {
  const [videos, setVideos] = useState<VideoPin[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVideosInBounds = async (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    setLoading(true);
    try {
      // This would fetch from Supabase with geolocation filters
      // For now, returning mock implementation that can be replaced
      const response = await fetch(
        `/api/videos/geo?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error("Error fetching geo videos:", error);
    } finally {
      setLoading(false);
    }
  };

  return { videos, loading, fetchVideosInBounds };
}

export default VideoMapPin;
