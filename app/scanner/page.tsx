"use client"

import { VisionScanner } from "@/components/ui/vision-scanner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/ui/auth-guard"
import { FloatingButtons } from "@/components/ui/floating-buttons"
import { Camera, Zap, BarChart3, Leaf, Globe, Lightbulb, Sparkles } from 'lucide-react'
import type { Scan } from "@/lib/types"

export default function ScannerPage() {
  const handleScanComplete = (scan: Scan) => {
    console.log("Scan completed:", scan)
    // In real implementation, save to Supabase database
  }

  const features = [
    {
      icon: Camera,
      title: "Camera & Upload",
      description: "Capture photos with your camera or upload existing images for analysis",
    },
    {
      icon: BarChart3,
      title: "Impact Analysis",
      description: "Calculate carbon footprint including production, transport, and disposal",
    },
    {
      icon: Leaf,
      title: "Eco Alternatives",
      description: "Discover sustainable alternatives with specific CO₂ reduction amounts",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
      <AuthGuard>
        {/* Floating Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/20 dark:bg-gray-900/20 backdrop-blur-md border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Environmental Impact Scanner
              </h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">AI-Powered Vision Analysis</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Instant Impact Analysis
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Point your camera at any object and discover its environmental footprint in seconds
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
              <VisionScanner onScanComplete={handleScanComplete} />
            </div>
          </div>

          <div className="">
            <h3 className="text-2xl font-bold text-center mb-12 text-gray-900 dark:text-white">
              Advanced Scanner Capabilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="group bg-gradient-to-br from-white/70 to-emerald-50/70 dark:from-gray-800/70 dark:to-emerald-900/70 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl hover:scale-105 overflow-hidden">
                  <CardHeader className="pb-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <feature.icon className="h-7 w-7 text-white" />
                      </div>
                      <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    </div>
  )
}
