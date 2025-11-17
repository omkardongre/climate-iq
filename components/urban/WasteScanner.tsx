"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, Upload, AlertCircle, CheckCircle, XCircle, Leaf, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface WasteAnalysis {
  wasteType: string;
  wasteSubtype: string;
  recyclable: boolean;
  disposalInstructions: string;
  carbonImpact: number;
  confidence: number;
}

export function WasteScanner() {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WasteAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setAnalysis(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/urban/waste-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: selectedImage,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to analyze waste');
        setAnalysis(null);
      } else {
        setAnalysis(data.analysis);
      }
    } catch (err: any) {
      setError(err.message || 'Network error: Failed to analyze waste');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setAnalysis(null);
    setError('');
  };

  const getWasteTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'plastic': return 'bg-blue-500';
      case 'paper': return 'bg-amber-500';
      case 'metal': return 'bg-gray-500';
      case 'glass': return 'bg-cyan-500';
      case 'organic': return 'bg-green-500';
      case 'electronic': return 'bg-purple-500';
      case 'hazardous': return 'bg-red-500';
      case 'textile': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getWasteTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'plastic': return '🥤';
      case 'paper': return '📄';
      case 'metal': return '🔩';
      case 'glass': return '🍾';
      case 'organic': return '🍎';
      case 'electronic': return '📱';
      case 'hazardous': return '☢️';
      case 'textile': return '👕';
      default: return '🗑️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-green-600" />
            AI Waste Scanner
          </CardTitle>
          <CardDescription>
            Upload a photo to identify waste type and get disposal instructions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {!selectedImage ? (
              <motion.div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                  isDragging 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  animate={{ 
                    y: isDragging ? -10 : 0,
                    scale: isDragging ? 1.1 : 1
                  }}
                  transition={{ type: "spring" }}
                >
                  {isDragging ? (
                    <Upload className="h-20 w-20 mx-auto mb-4 text-green-500" />
                  ) : (
                    <Camera className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                  )}
                </motion.div>
                <p className="text-lg font-medium mb-2">
                  {isDragging ? 'Drop image here!' : 'Upload or Drag Waste Photo'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Take a clear photo of the waste item for AI analysis
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="waste-image-input"
                />
                <label htmlFor="waste-image-input">
                  <Button asChild>
                    <span>
                      <Camera className="mr-2 h-4 w-4" />
                      Choose Image
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Max file size: 5MB • PNG, JPG, WEBP
                </p>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-4"
                >
                  <div className="relative w-full h-80 rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={selectedImage}
                      alt="Selected waste"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="flex-1"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Analyzing with AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Analyze Waste
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      disabled={loading}
                      size="lg"
                    >
                      Reset
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Waste Type Card */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Waste Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="flex items-center gap-4"
                >
                  <div className="text-6xl">{getWasteTypeIcon(analysis.wasteType)}</div>
                  <div className="flex-1">
                    <Badge className={`${getWasteTypeColor(analysis.wasteType)} text-white mb-2 text-sm px-3 py-1`}>
                      {analysis.wasteType.toUpperCase()}
                    </Badge>
                    <p className="text-xl font-semibold">{analysis.wasteSubtype}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-50"
                >
                  {analysis.recyclable ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-sm font-medium text-green-600">✨ Recyclable</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Non-Recyclable</span>
                    </>
                  )}
                </motion.div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">AI Confidence</span>
                    <span className="font-bold text-lg">{analysis.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.confidence}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Environmental Impact Card */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  Environmental Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <p className="text-sm text-muted-foreground mb-1">Carbon Impact if Recycled</p>
                  <p className="text-4xl font-bold text-green-600">
                    {analysis.carbonImpact.toFixed(2)} kg
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">CO2e saved vs landfill</p>
                </motion.div>

                <div className="pt-3 border-t border-green-200">
                  <p className="text-sm font-semibold mb-3 text-green-900">💚 Equivalent To:</p>
                  <div className="space-y-2">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span>🚗</span>
                      <span className="font-medium">{(analysis.carbonImpact * 4).toFixed(1)} km</span>
                      <span className="text-muted-foreground">of driving</span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span>💡</span>
                      <span className="font-medium">{(analysis.carbonImpact * 10).toFixed(0)} hours</span>
                      <span className="text-muted-foreground">of LED bulb</span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span>🌳</span>
                      <span className="font-medium">{(analysis.carbonImpact / 20).toFixed(2)} trees</span>
                      <span className="text-muted-foreground">for 1 year</span>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disposal Instructions Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">♻️ Disposal Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm leading-relaxed"
                >
                  {analysis.disposalInstructions}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
