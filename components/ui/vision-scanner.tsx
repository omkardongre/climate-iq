"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Zap, Leaf, AlertCircle, CheckCircle, AlertTriangle, X } from "lucide-react"
import { TTSControls } from "@/components/ui/tts-controls"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Scan } from "@/lib/types"
import { IMPACT_LEVELS } from "@/lib/constants"

interface VisionScannerProps {
  onScanComplete?: (scan: Scan) => void
}

export function VisionScanner({ onScanComplete }: VisionScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<Scan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        setError(null)
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions or upload an image instead.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }, [])

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      const imageData = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedImage(imageData)
      stopCamera()
      processImage(imageData)
    }
  }, [stopCamera])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setCapturedImage(imageData)
        processImage(imageData)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const processImage = async (imageData: string) => {
    setIsScanning(true)
    setProgress(0)
    setError(null)

    try {
      // Real API implementation with vision AI
      setProgress(25)
      
      // Direct API call to avoid dynamic import issues
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imageData
        })
      })
      
      setProgress(50)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }
      
      const analysisResult = await response.json()
      
      setProgress(75)

      // Convert to our Scan format
      const scanResult: Scan = {
        id: Date.now().toString(),
        user_id: "current-user",
        image_url: imageData,
        item_category: analysisResult.item_category,
        carbon_footprint: analysisResult.carbon_footprint,
        alternatives: analysisResult.alternatives,
        location: { latitude: 0, longitude: 0 },
        timestamp: new Date().toISOString(),
      }

      // Save scan to database for personalization
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          const response = await fetch('/api/scan-history', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              object_name: analysisResult.item_category,
              category: analysisResult.item_category,
              carbon_footprint: analysisResult.carbon_footprint
            })
          })
          
          if (!response.ok) {
            console.warn(`Failed to save scan history: ${response.status} ${response.statusText}`)
          }
        } else {
          console.warn("No authentication session found for saving scan history")
        }
      } catch (saveError) {
        console.warn("Failed to save scan history:", saveError)
        // Don't fail the scan if saving fails
      }

      setProgress(100)
      setScanResult(scanResult)
      onScanComplete?.(scanResult)
    } catch (err: any) {
      console.error("Vision analysis error:", err)
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      
      if (err.message.includes("temporarily limited")) {
        setError("AI service temporarily limited to preserve free tier. Please try again in a few minutes.")
      } else if (err.message.includes("API error")) {
        setError(`API Error: ${err.message}. Please check your API key configuration.`)
      } else {
        setError(`Analysis failed: ${err.message || 'Unknown error'}. Please try again.`)
      }
    } finally {
      setIsScanning(false)
    }
  }

  const getImpactLevel = (footprint: number) => {
    for (const [level, config] of Object.entries(IMPACT_LEVELS)) {
      if (footprint >= config.min && footprint < config.max) {
        return { level, ...config }
      }
    }
    return { level: "HIGH", ...IMPACT_LEVELS.HIGH }
  }

  const resetScanner = () => {
    setScanResult(null)
    setCapturedImage(null)
    setError(null)
    setProgress(0)
    stopCamera()
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Outback Impact Scanner
          </CardTitle>
          <CardDescription>
            Scan farm equipment, household items, or native materials to see their environmental impact and find outback-friendly alternatives
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!capturedImage && !scanResult && (
            <div className="space-y-4">
              {/* Camera View */}
              {cameraActive ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover rounded-lg bg-gray-100"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Position object here</span>
                    </div>
                  </div>
                  <Button
                    onClick={captureImage}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Capture
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    size="sm"
                    className="absolute top-4 right-4 bg-transparent"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4 py-8">
                  <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">Ready to scan farm gear, household items, or native materials</p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button onClick={startCamera} className="bg-green-600 hover:bg-green-700">
                          <Camera className="mr-2 h-4 w-4" />
                          Use Camera
                        </Button>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          )}

          {/* Processing State */}
          {isScanning && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Zap className="mx-auto h-12 w-12 text-blue-500 animate-pulse mb-4" />
                  <p className="text-lg font-medium mb-2">Analyzing with Outback AI...</p>
                  <Progress value={progress} className="w-64" />
                  <p className="text-sm text-gray-600 mt-2">
                    {progress < 25 && "Processing image..."}
                    {progress >= 25 && progress < 50 && "Identifying object..."}
                    {progress >= 50 && progress < 75 && "Calculating carbon footprint..."}
                    {progress >= 75 && "Finding outback-friendly alternatives..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {scanResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Scan Results</h3>
                <Button variant="outline" size="sm" onClick={resetScanner}>
                  Scan Again
                </Button>
              </div>

              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Scanned object"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg capitalize">{scanResult.item_category.replace(/_/g, ' ')}</h4>
                        <TTSControls 
                          text={`Scan results for ${scanResult.item_category.replace(/_/g, ' ')}. Carbon footprint: ${scanResult.carbon_footprint} kilograms CO2. This includes production, transportation, and disposal impacts.`}
                          size="sm"
                          showStatus={false}
                        />
                      </div>
                      <p className="text-sm text-gray-600">Scanned object analysis</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${
                        getImpactLevel(scanResult.carbon_footprint).color === "green"
                          ? "bg-green-100 text-green-800"
                          : getImpactLevel(scanResult.carbon_footprint).color === "yellow"
                            ? "bg-yellow-100 text-yellow-800"
                            : getImpactLevel(scanResult.carbon_footprint).color === "orange"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {getImpactLevel(scanResult.carbon_footprint).label}
                    </Badge>
                  </div>

                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Carbon Footprint: {scanResult.carbon_footprint} kg CO₂</strong>
                      <br />
                      This includes production, transportation, and disposal impacts.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h5 className="font-medium flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-600" />
                        Outback-Friendly Alternatives
                      </h5>
                      <TTSControls 
                        text={`Sustainable alternatives: ${scanResult.alternatives.map(alt => 
                          `${alt.name}, ${alt.description}, saves ${alt.carbon_reduction} kilograms CO2, difficulty level ${alt.difficulty}`
                        ).join('. ')}`}
                        size="sm"
                        showStatus={false}
                      />
                    </div>
                    <div className="space-y-3">
                      {scanResult.alternatives.map((alt, index) => (
                        <div key={index} className="flex items-start justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h6 className="font-medium">{alt.name}</h6>
                              <Badge variant="outline">
                                {alt.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alt.description}</p>
                            <div className="flex items-center gap-1 text-sm text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Saves {alt.carbon_reduction} kg CO₂
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
