"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, Upload, AlertCircle, CheckCircle, XCircle, Leaf } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

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

  useEffect(() => {
    if (user) {
      console.log('WasteScanner - Logged in user:', user.id);
    } else {
      console.log('WasteScanner - No user logged in');
    }
  }, [user]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send base64 image data directly (same as analyze-image route)
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-green-500 transition-colors">
                <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Upload Waste Photo</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Take a clear photo of the waste item for AI analysis
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="waste-image-input"
                />
                <label htmlFor="waste-image-input">
                  <Button asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Max file size: 5MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full h-64 rounded-lg overflow-hidden border">
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
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Analyze Waste
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Waste Type Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Waste Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getWasteTypeIcon(analysis.wasteType)}</span>
                <div>
                  <Badge className={`${getWasteTypeColor(analysis.wasteType)} text-white mb-1`}>
                    {analysis.wasteType.toUpperCase()}
                  </Badge>
                  <p className="text-lg font-semibold">{analysis.wasteSubtype}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {analysis.recyclable ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Recyclable</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Non-Recyclable</span>
                  </>
                )}
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI Confidence</span>
                  <span className="font-medium">{analysis.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${analysis.confidence}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environmental Impact Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Carbon Impact if Recycled</p>
                <p className="text-3xl font-bold text-green-600">
                  {analysis.carbonImpact.toFixed(2)} kg
                </p>
                <p className="text-xs text-muted-foreground mt-1">CO2e saved vs landfill</p>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Equivalent To:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>🚗 {(analysis.carbonImpact * 4).toFixed(1)} km of driving</p>
                  <p>💡 {(analysis.carbonImpact * 10).toFixed(0)} hours of LED bulb</p>
                  <p>🌳 {(analysis.carbonImpact / 20).toFixed(2)} trees for 1 year</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disposal Instructions Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Disposal Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.disposalInstructions}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
