"use client";

import MuxUploader from "@mux/mux-uploader-react";
import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, AlertCircle, Video, X } from "lucide-react";

interface VideoUploaderProps {
  onUploadComplete?: (assetId: string, playbackId: string) => void;
  onUploadError?: (error: Error) => void;
  title?: string;
  description?: string;
  // Metadata to pass through to the asset
  passthrough?: string;
  // Styling
  className?: string;
}

type UploadStatus = "idle" | "fetching-url" | "uploading" | "processing" | "complete" | "error";

/**
 * VideoUploader - A production-ready video upload component using Mux Direct Upload
 */
export function VideoUploader({
  onUploadComplete,
  onUploadError,
  title = "Upload Climate Story",
  description = "Share a video of climate events in your area. Your video will automatically get captions for accessibility.",
  passthrough,
  className = "",
}: VideoUploaderProps) {
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch a direct upload URL from our API
  const fetchUploadUrl = useCallback(async () => {
    try {
      setStatus("fetching-url");
      setError(null);

      const response = await fetch("/api/mux/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passthrough,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const data = await response.json();
      setUploadUrl(data.uploadUrl);
      setUploadId(data.uploadId);
      setStatus("idle");
    } catch (err) {
      console.error("Error fetching upload URL:", err);
      setError("Failed to prepare upload. Please try again.");
      setStatus("error");
      onUploadError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [passthrough, onUploadError]);

  const pollForAsset = useCallback(async (uploadId: string) => {
    const maxAttempts = 60; // 5 minutes at 5 second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/mux/upload-url?id=${uploadId}`);
        const data = await response.json();

        console.log("Polling upload status:", data);

        // Check if asset has been created (status is "asset_created" or assetId is present)
        if (data.assetId) {
          // Get the asset details including playback ID
          const assetResponse = await fetch(`/api/mux/assets?id=${data.assetId}`);
          const assetData = await assetResponse.json();

          console.log("Asset data:", assetData);

          // Check if asset is ready with playback ID
          if (assetData.playbackId || assetData.playback_id) {
            setStatus("complete");
            onUploadComplete?.(data.assetId, assetData.playbackId || assetData.playback_id);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setError("Upload processing timed out. Please check back later.");
          setStatus("error");
        }
      } catch (err) {
        console.error("Error polling for asset:", err);
        setError("Error checking upload status.");
        setStatus("error");
      }
    };

    poll();
  }, [onUploadComplete]);

  const handleUploadStart = () => {
    console.log("Upload started");
    setStatus("uploading");
    setProgress(0);
  };

  // Progress event - MuxUploader passes CustomEvent with detail as percentage (0-100)
  const handleProgress = (event: CustomEvent<number>) => {
    const progressValue = event.detail;
    console.log("Upload progress:", progressValue);
    setProgress(Math.round(progressValue));
  };

  const handleSuccess = () => {
    console.log("Upload success, polling for asset...");
    setStatus("processing");
    if (uploadId) {
      pollForAsset(uploadId);
    }
  };

  // Error handler - MuxUploader uses onUploadError prop
  const handleUploadError = (event: CustomEvent<{ message: string }>) => {
    console.error("Upload error:", event.detail);
    setError("Upload failed. Please try again.");
    setStatus("error");
    onUploadError?.(new Error(event.detail?.message || "Upload failed"));
  };

  const handleReset = () => {
    setUploadUrl(null);
    setUploadId(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
  };

  // Render based on status

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-green-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 1. INITIAL STATE: Click to upload */}
          {!uploadUrl && status === "idle" && (
            <div
              onClick={fetchUploadUrl}
              className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
            >
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">Click to upload video</p>
              <p className="text-sm text-gray-500 mt-1">
                MP4, MOV, or WebM up to 2GB
              </p>
              <Badge variant="secondary" className="mt-4">
                <Video className="h-3 w-3 mr-1" />
                Auto-captions enabled
              </Badge>
            </div>
          )}

          {/* 2. PREPARING STATE */}
          {status === "fetching-url" && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4" />
              <p>Preparing upload...</p>
            </div>
          )}

          {/* 3. UPLOADING STATE (Progress Bar Overlay) */}
          {status === "uploading" && (
            <div className="py-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 mt-2">
                Please keep this window open until the upload completes.
              </p>
            </div>
          )}

          {/* 4. PROCESSING STATE */}
          {status === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4" />
              <p className="font-medium">Processing video...</p>
              <p className="text-sm text-gray-400 mt-1">
                This may take a minute. Auto-captions are being generated.
              </p>
            </div>
          )}

          {/* 5. COMPLETE STATE */}
          {status === "complete" && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <p className="text-lg font-semibold text-green-600">Upload Complete!</p>
              <p className="text-sm text-gray-500 mt-1">
                Your video is now being processed with AI captions.
              </p>
              <Button onClick={handleReset} variant="outline" className="mt-4">
                Upload Another
              </Button>
            </div>
          )}

          {/* 6. ERROR STATE */}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-lg font-semibold text-red-500">Upload Failed</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
              <Button onClick={handleReset} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          )}

          {/* 
              MUX UPLOADER COMPONENT 
              CRITICAL: Must remain mounted when transitioning from 'idle' (default view) 
              to 'uploading' (hidden view). This ensures the upload process isn't interrupted.
          */}
          {uploadUrl && status !== "complete" && status !== "processing" && status !== "error" && (
            <div className={status === "uploading" ? "hidden" : "block"}>
              <div className="relative">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <MuxUploader
                  endpoint={uploadUrl}
                  onUploadStart={handleUploadStart}
                  onProgress={handleProgress as any}
                  onSuccess={handleSuccess}
                  onUploadError={handleUploadError as any}
                  style={{
                    "--button-background-color": "#16a34a",
                    "--button-hover-background-color": "#15803d",
                    "--button-border-radius": "0.5rem",
                    "--progress-bar-fill-color": "#22c55e",
                    "--drop-zone-border-color": "#22c55e",
                  } as React.CSSProperties}
                />
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default VideoUploader;
