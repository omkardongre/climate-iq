"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MuxLivePlayer } from "@/components/video/MuxVideoPlayer";
import { 
  Radio, 
  Copy, 
  Check, 
  AlertCircle, 
  Video, 
  Settings, 
  Users, 
  MapPin,
  Clock,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Stream types
const STREAM_TYPES = [
  { value: "harvest", label: "Harvest Update" },
  { value: "weather", label: "Weather Report" },
  { value: "expert_advice", label: "Expert Advice" },
  { value: "community", label: "Community Event" },
  { value: "other", label: "Other" },
];

// Stream status type
type StreamStatus = "idle" | "creating" | "ready" | "active" | "ended" | "error";

interface LiveStreamData {
  id: string;
  streamKey: string;
  playbackId: string;
  rtmpUrl: string;
}

/**
 * HarvestLiveBroadcaster - Component for farmers to start live streams
 */
export function HarvestLiveBroadcaster() {
  const supabase = createClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [dialogState, setDialogState] = useState<"form" | "credentials" | "live">("form");
  const [streamData, setStreamData] = useState<LiveStreamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"key" | "url" | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    streamType: "",
    locationName: "",
  });

  // Create a new live stream
  const handleCreateStream = async () => {
    if (!formData.title.trim()) {
      setError("Please enter a title for your stream");
      return;
    }

    setStatus("creating");
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please sign in to start a live stream");
        setStatus("idle");
        return;
      }

      // Create stream via API
      const response = await fetch("/api/mux/live-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passthrough: formData.title,
          reducedLatency: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create stream");
      }

      const data = await response.json();

      // Save to Supabase
      const { error: insertError } = await supabase
        .from("live_streams")
        .insert({
          user_id: user.id,
          mux_stream_id: data.id,
          stream_key: data.streamKey,
          playback_id: data.playbackId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          stream_type: formData.streamType || null,
          location_name: formData.locationName.trim() || null,
          status: "idle",
        });

      if (insertError) {
        console.error("Error saving stream:", insertError);
      }

      setStreamData({
        id: data.id,
        streamKey: data.streamKey,
        playbackId: data.playbackId,
        rtmpUrl: data.rtmpUrl,
      });
      setStatus("ready");
      setDialogState("credentials");
    } catch (err) {
      console.error("Error creating stream:", err);
      setError("Failed to create stream. Please try again.");
      setStatus("error");
    }
  };

  // Copy to clipboard
  const handleCopy = async (text: string, type: "key" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Helper to sync status with Supabase (Critical for localhost where webhooks fail)
  const updateStreamStatus = async (muxStreamId: string, newStatus: "active" | "idle") => {
    try {
      console.log(`Syncing stream status ${newStatus} for ${muxStreamId}`);
      
      // Update payload
      const updates: any = { 
         status: newStatus,
         updated_at: new Date().toISOString() 
      };
      
      if (newStatus === "active") {
        updates.started_at = new Date().toISOString();
      } else if (newStatus === "idle") {
        updates.ended_at = new Date().toISOString();
      }

      // We match against mux_stream_id
      const { error } = await supabase
        .from("live_streams")
        .update(updates)
        .eq("mux_stream_id", muxStreamId);

      if (error) {
        console.error("Failed to sync stream status:", error);
      }
    } catch (err) {
      console.error("Error syncing stream status:", err);
    }
  };

  const handleStartStream = async () => {
    if (streamData) {
      setStatus("active");
      setDialogState("live");
      await updateStreamStatus(streamData.id, "active");
    }
  };

  const handleEndStream = async () => {
    if (streamData) {
      setStatus("ended"); // Or back to idle, depending on desired flow
      setDialogState("form"); // Close live view, go back to form or summary
      await updateStreamStatus(streamData.id, "idle");
      handleReset(); // Reset form after ending stream
    }
  };

  // Reset form
  const handleReset = () => {
    setStatus("idle");
    setStreamData(null);
    setError(null);
    setFormData({ title: "", description: "", streamType: "", locationName: "" });
    setDialogState("form");
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700">
          <Radio className="w-4 h-4 mr-2" />
          Go Live
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-red-600" />
            🚜 Harvest Live Broadcast
          </DialogTitle>
          <DialogDescription>
            Share real-time updates from your farm with the community. 
            Low-latency streaming with automatic captions and recording.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Stream Details */}
          {status === "idle" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Stream Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Morning Field Update - Wheat Harvest"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What will you be sharing today?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Stream Type</Label>
                  <Select
                    value={formData.streamType}
                    onValueChange={(value) => setFormData({ ...formData, streamType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {STREAM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Punjab, India"
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleCreateStream} className="w-full">
                Create Stream
              </Button>
            </div>
          )}

          {/* Creating State */}
          {status === "creating" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
              <p className="font-medium">Setting up your stream...</p>
              <p className="text-sm text-gray-500">This will only take a moment</p>
            </div>
          )}

          {/* Step 2: Stream Ready - Show Credentials */}
          {status === "ready" && streamData && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Your stream is ready! Use these credentials with OBS, Streamlabs, or any RTMP streaming software.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Stream Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* RTMP URL */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Server / RTMP URL</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={streamData.rtmpUrl}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(streamData.rtmpUrl, "url")}
                      >
                        {copied === "url" ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Stream Key */}
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Stream Key (keep this secret!)</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        type="password"
                        value={streamData.streamKey}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(streamData.streamKey, "key")}
                      >
                        {copied === "key" ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Next steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open OBS Studio or your streaming app</li>
                  <li>Go to Settings → Stream</li>
                  <li>Set Service to &quot;Custom&quot;</li>
                  <li>Paste the RTMP URL and Stream Key</li>
                  <li>Click &quot;Start Streaming&quot;</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleStartStream}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Radio className="w-4 h-4 mr-2 animate-pulse" />
                  I&apos;m Streaming!
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Active Stream - Show Preview */}
          {status === "active" && streamData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  0 watching
                </span>
              </div>

              {/* Live Preview */}
              <MuxLivePlayer
                playbackId={streamData.playbackId}
                title={formData.title}
                lowLatency
                metadata={{
                  video_title: formData.title,
                  climate_topic: formData.streamType,
                  user_region: formData.locationName,
                  feature_used: "harvest_live",
                }}
              />

              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium">{formData.title}</h4>
                {formData.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formData.description}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {formData.streamType && (
                    <Badge variant="secondary">
                      {STREAM_TYPES.find(t => t.value === formData.streamType)?.label}
                    </Badge>
                  )}
                  {formData.locationName && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {formData.locationName}
                    </Badge>
                  )}
                </div>
              </div>

              <Button 
                variant="destructive" 
                onClick={handleEndStream}
                className="w-full"
              >
                End Stream
              </Button>
            </div>
          )}

          {/* Stream Ended */}
          {status === "ended" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Check className="w-16 h-16 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold">Stream Ended</h3>
              <p className="text-gray-500 text-center mt-2">
                Your stream has been saved and will be available as a recording shortly.
              </p>
              <Button onClick={handleReset} variant="outline" className="mt-4">
                Start New Stream
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * LiveStreamCard - Display card for active or recent live streams
 */
interface LiveStream {
  id: string;
  title: string;
  description?: string;
  playbackId: string;
  status: "idle" | "active" | "disabled";
  streamType?: string;
  locationName?: string;
  startedAt?: string;
  viewerCount?: number;
}

interface LiveStreamCardProps {
  stream: LiveStream;
  onClick?: () => void;
}

export function LiveStreamCard({ stream, onClick }: LiveStreamCardProps) {
  const isLive = stream.status === "active";

  return (
    <Card 
      className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${isLive ? "border-red-500 border-2" : ""}`}
      onClick={onClick}
    >
      <div className="relative aspect-video bg-gray-900">
        {isLive ? (
          <MuxLivePlayer
            playbackId={stream.playbackId}
            title={stream.title}
            lowLatency
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Video className="w-12 h-12" />
          </div>
        )}
        {isLive && (
          <Badge 
            variant="destructive" 
            className="absolute top-2 left-2 animate-pulse"
          >
            <Radio className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-1">{stream.title}</h3>
        {stream.description && (
          <p className="text-sm text-gray-500 line-clamp-1 mt-1">
            {stream.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
          {stream.viewerCount !== undefined && isLive && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {stream.viewerCount} watching
            </span>
          )}
          {stream.locationName && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {stream.locationName}
            </span>
          )}
          {stream.startedAt && isLive && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Started {new Date(stream.startedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default HarvestLiveBroadcaster;
