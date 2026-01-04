"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoUploader } from "@/components/video/VideoUploader";
import { HarvestLiveBroadcaster } from "@/components/video/HarvestLiveBroadcaster";
import { MuxVideoPlayer, MuxLivePlayer } from "@/components/video/MuxVideoPlayer";
import { getThumbnailUrl, getAnimatedGifUrl } from "@/lib/mux";
import { Video, MapPin, Eye, Heart, Clock, Play, Plus, X, AlertCircle, Trash2, Sparkles, Loader2 } from "lucide-react";
import Image from "next/image";

// Types for climate videos
interface ClimateVideo {
  id: string;
  user_id: string;
  mux_asset_id: string;
  playback_id: string | null;
  title: string;
  description: string | null;
  duration: number | null;
  aspect_ratio: string | null;
  status: "uploading" | "processing" | "ready" | "error";
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  climate_topic: string | null;
  tags: string[] | null;
  view_count: number;
  like_count: number;
  created_at: string;
  created_at: string;
}

// Types for live streams
interface LiveStream {
  id: string;
  user_id: string;
  playback_id: string;
  title: string;
  description: string | null;
  status: "idle" | "active" | "disabled";
  stream_type: string | null;
  location_name: string | null;
  peak_viewers: number;
}

// Climate topic options
const CLIMATE_TOPICS = [
  { value: "agriculture", label: "Agriculture & Farming" },
  { value: "urban", label: "Urban Sustainability" },
  { value: "education", label: "Climate Education" },
  { value: "weather", label: "Weather Events" },
  { value: "wildlife", label: "Wildlife & Nature" },
  { value: "other", label: "Other" },
];

/**
 * ClimateStoriesTab - Production-ready component for Climate Stories feature
 * Uses Mux for video hosting with direct upload, thumbnails, and playback
 */
export function ClimateStoriesTab() {
  const supabase = createClient();
  const [videos, setVideos] = useState<ClimateVideo[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<ClimateVideo | null>(null);
  const [selectedLiveStream, setSelectedLiveStream] = useState<LiveStream | null>(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Upload form state
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);
  const [uploadedPlaybackId, setUploadedPlaybackId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    climateTopic: "",
    locationName: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });
  }, [supabase]);

  const handleDeleteVideo = async (video: ClimateVideo) => {
    if (!confirm("Are you sure you want to delete this video? This cannot be undone.")) return;

    try {
      // 1. Delete from Mux via API
      const response = await fetch(`/api/mux/assets?id=${video.mux_asset_id}`, { method: 'DELETE' });
      
      // Even if Mux delete fails (e.g. 404), we should try to clean up Supabase
      if (!response.ok && response.status !== 404) {
         console.warn("Mux delete reported error, proceeding to DB delete anyway");
      }

      // 2. Delete from Supabase
      const { error } = await supabase.from('climate_videos').delete().eq('id', video.id);
      if (error) throw error;

      // 3. Update UI
      setVideos(prev => prev.filter(v => v.id !== video.id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete video. Please try again.");
    }
  };



  // Fetch videos from Supabase
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from("climate_videos")
        .select("*")
        .eq("status", "ready")
        .order("created_at", { ascending: false })
        .limit(20);

      if (fetchError) {
        console.error("Error fetching videos:", fetchError);
        setError("Failed to load videos");
        return;
      }

      setVideos(data || []);

      // Fetch active live streams
      const { data: liveData, error: liveError } = await supabase
        .from("live_streams")
        .select("*")
        .eq("status", "active")
        .order("started_at", { ascending: false });

      if (liveError) {
        console.error("Error fetching live streams:", liveError);
      } else {
        setLiveStreams(liveData || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Handle upload completion
  const handleUploadComplete = useCallback((assetId: string, playbackId: string) => {
    setUploadedAssetId(assetId);
    setUploadedPlaybackId(playbackId);
  }, []);

  // Save video metadata to Supabase
  const handleSaveVideo = async () => {
    if (!uploadedAssetId || !uploadedPlaybackId) {
      setError("Please upload a video first");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a title for your video");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please sign in to share your climate story");
        setIsSaving(false);
        return;
      }

      // Insert video record
      const { error: insertError } = await supabase
        .from("climate_videos")
        .insert({
          user_id: user.id,
          mux_asset_id: uploadedAssetId,
          playback_id: uploadedPlaybackId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          climate_topic: formData.climateTopic || null,
          location_name: formData.locationName.trim() || null,
          status: "ready",
        });

      if (insertError) {
        console.error("Error saving video:", insertError);
        setError("Failed to save video. Please try again.");
        setIsSaving(false);
        return;
      }

      // Reset form and close modal
      setFormData({ title: "", description: "", climateTopic: "", locationName: "" });
      setUploadedAssetId(null);
      setUploadedPlaybackId(null);
      setIsUploadModalOpen(false);
      
      // Refresh video list
      fetchVideos();
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to save video");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate AI Chapters
  const handleGenerateChapters = async () => {
    if (!selectedVideo || !selectedVideo.mux_asset_id) return;

    setIsGeneratingChapters(true);
    try {
      const response = await fetch("/api/mux/ai/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selectedVideo.mux_asset_id,
          provider: "gemini", // Use Gemini for hackathon
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate chapters");
      }

      // Format chapters as text to append to description
      const chaptersText = "\n\n**🤖 AI Chapters:**\n" + 
        data.chapters.map((c: any) => `${c.startTime} - ${c.title}`).join("\n");

      const newDescription = (selectedVideo.description || "") + chaptersText;

      // Update Supabase
      const { error: updateError } = await supabase
        .from("climate_videos")
        .update({ description: newDescription })
        .eq("id", selectedVideo.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedVideo = { ...selectedVideo, description: newDescription };
      setSelectedVideo(updatedVideo);
      setVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));

    } catch (err) {
      console.error("Error generating chapters:", err);
      alert("Failed to generate chapters. Transcript might not be ready yet.");
    } finally {
      setIsGeneratingChapters(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render video thumbnail with hover GIF effect
  const renderVideoThumbnail = (video: ClimateVideo) => {
    if (!video.playback_id) return null;
    
    const isHovered = hoveredVideoId === video.id;
    const imageUrl = isHovered 
      ? getAnimatedGifUrl(video.playback_id, { width: 320, height: 180, fps: 10, start: 0, end: 3 })
      : getThumbnailUrl(video.playback_id, { width: 640, height: 360, time: 1 });

    return (
      <div 
        className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800 cursor-pointer group"
        onMouseEnter={() => setHoveredVideoId(video.id)}
        onMouseLeave={() => setHoveredVideoId(null)}
        onClick={() => {
          setSelectedVideo(video);
          setIsVideoModalOpen(true);
        }}
      >
        <Image
          src={imageUrl}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized // Required for Mux dynamic URLs
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-green-600 ml-1" />
          </div>
        </div>
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Live Now Section */}
      {liveStreams.length > 0 && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
              Happening Now: Live Harvests
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveStreams.map((stream) => (
              <div 
                key={stream.id}
                className="group relative bg-white dark:bg-black rounded-lg overflow-hidden border border-red-100 dark:border-red-900/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedLiveStream(stream);
                  setIsLiveModalOpen(true);
                }}
              >
                {/* Live Preview - Static Thumbnail with Play Overlay (Production UX) */}
                <div className="aspect-video bg-gray-900 relative overflow-hidden">
                  {/* Static thumbnail from Mux - shows first frame of live stream */}
                  <Image
                    src={`https://image.mux.com/${stream.playback_id}/thumbnail.png?time=0&width=640&height=360`}
                    alt={stream.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  
                  {/* Play button overlay - click to watch */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-white ml-1" fill="white" />
                    </div>
                  </div>
                  
                  {/* LIVE badge and viewer count */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                    <Badge variant="secondary" className="bg-black/50 text-white border-none flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {stream.peak_viewers || 1}
                    </Badge>
                  </div>
                  
                  {/* "Click to Watch" hint */}
                  <div className="absolute bottom-2 left-2 right-2 text-center">
                    <span className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                      Click to join live stream
                    </span>
                  </div>
                </div>
                
                <div className="p-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{stream.title}</h4>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                     <span className="flex items-center gap-1">
                       <MapPin className="w-3 h-3" />
                       {stream.location_name || "Unknown Location"}
                     </span>
                     <span className="text-xs border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                       {stream.stream_type || "Broadcast"}
                     </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Stream Modal */}
      <Dialog open={isLiveModalOpen} onOpenChange={setIsLiveModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black text-white">
           <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 w-full bg-gradient-to-b from-black/80 to-transparent">
             <div className="flex items-center justify-between">
                <div>
                   <DialogTitle className="flex items-center gap-2 text-white">
                      <span className="animate-pulse w-3 h-3 rounded-full bg-red-500"></span>
                      {selectedLiveStream?.title}
                   </DialogTitle>
                   <DialogDescription className="text-gray-300">
                      Live from {selectedLiveStream?.location_name}
                   </DialogDescription>
                </div>
                {/* Explicit Close Button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={() => setIsLiveModalOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
             </div>
           </DialogHeader>
           
           <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              {selectedLiveStream && (
                <MuxLivePlayer
                  playbackId={selectedLiveStream.playback_id}
                  title={selectedLiveStream.title}
                  className="w-full h-full"
                  autoPlay
                  lowLatency
                  metadata={{
                    video_id: selectedLiveStream.id,
                    video_title: selectedLiveStream.title,
                    viewer_user_id: currentUser?.id,
                    custom_1: "live_modal_view"
                  }}
                />
              )}
           </div>
           
           <div className="p-4 bg-gray-900">
              <div className="flex gap-4">
                 <div className="flex-1">
                    <p className="text-sm text-gray-400">{selectedLiveStream?.description || "No description provided."}</p>
                 </div>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            📹 Climate Stories
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Share your climate experiences with the community. Upload videos of weather events, 
            farming practices, or environmental changes in your area.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <HarvestLiveBroadcaster />
          
          {/* Upload Button */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Share Your Story
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-green-600" />
                Share Your Climate Story
              </DialogTitle>
              <DialogDescription>
                Upload a video about climate events, farming conditions, or environmental changes in your area. 
                Your video will be auto-captioned for accessibility.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Video Uploader */}
              {!uploadedPlaybackId ? (
                <VideoUploader
                  onUploadComplete={handleUploadComplete}
                  onUploadError={(err) => setError(err.message)}
                  title="Upload Video"
                  description="Drag and drop or click to upload. MP4, MOV, or WebM up to 2GB."
                  passthrough={currentUser?.id}
                />
              ) : (
                <div className="space-y-4">
                  {/* Preview of uploaded video */}
                  <div className="relative rounded-lg overflow-hidden">
                    <MuxVideoPlayer
                      playbackId={uploadedPlaybackId}
                      title="Preview"
                      aspectRatio="16/9"
                      muted
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => {
                        setUploadedAssetId(null);
                        setUploadedPlaybackId(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    ✓ Video uploaded successfully
                  </Badge>
                </div>
              )}

              {/* Video Details Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Give your climate story a title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what's happening in your video..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Climate Topic</Label>
                    <Select
                      value={formData.climateTopic}
                      onValueChange={(value) => setFormData({ ...formData, climateTopic: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIMATE_TOPICS.map((topic) => (
                          <SelectItem key={topic.value} value={topic.value}>
                            {topic.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Mumbai, India"
                      value={formData.locationName}
                      onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Save Button */}
              <Button 
                className="w-full" 
                onClick={handleSaveVideo}
                disabled={!uploadedPlaybackId || !formData.title || isSaving}
              >
                {isSaving ? "Saving..." : "Share Climate Story"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Error state */}
      {error && !isUploadModalOpen && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && videos.length === 0 && (
        <Card className="p-12 text-center">
          <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Climate Stories Yet</h3>
          <p className="text-gray-500 mb-4">
            Be the first to share your climate experience with the community!
          </p>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Share Your Story
          </Button>
        </Card>
      )}

      {/* Video Grid */}
      {!loading && videos.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card 
              key={video.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {renderVideoThumbnail(video)}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
                    {currentUser?.id === video.user_id && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-2" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeleteVideo(video); 
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {video.description && (
                  <CardDescription className="line-clamp-2">
                    {video.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {video.climate_topic && (
                    <Badge variant="secondary">
                      {CLIMATE_TOPICS.find(t => t.value === video.climate_topic)?.label || video.climate_topic}
                    </Badge>
                  )}
                  {video.location_name && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {video.location_name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {video.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {video.like_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(video.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Playback Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          {selectedVideo?.playback_id && (
            <>
              <MuxVideoPlayer
                playbackId={selectedVideo.playback_id}
                title={selectedVideo.title}
                aspectRatio={selectedVideo.aspect_ratio || "16/9"}
                autoPlay
                metadata={{
                  video_title: selectedVideo.title,
                  video_id: selectedVideo.id,
                  climate_topic: selectedVideo.climate_topic || undefined,
                  feature_used: "climate_stories",
                }}
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{selectedVideo.title}</h3>
                {selectedVideo.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {selectedVideo.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedVideo.climate_topic && (
                    <Badge variant="secondary">
                      {CLIMATE_TOPICS.find(t => t.value === selectedVideo.climate_topic)?.label}
                    </Badge>
                  )}
                  {selectedVideo.location_name && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedVideo.location_name}
                    </Badge>
                  )}
                </div>
                
                {/* AI Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                    onClick={handleGenerateChapters}
                    disabled={isGeneratingChapters || (selectedVideo.description || "").includes("**🤖 AI Chapters:**")}
                  >
                    {isGeneratingChapters ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Chapters...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        { (selectedVideo.description || "").includes("**🤖 AI Chapters:**") ? "AI Chapters Generated" : "Generate AI Chapters" }
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    Powered by Google Gemini 1.5 Pro
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClimateStoriesTab;
