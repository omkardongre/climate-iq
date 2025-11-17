"use client"

import { useState, useEffect } from "react"
import { ClimateBoard } from "@/components/ui/climate-board"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/ui/auth-guard"
import { FloatingButtons } from "@/components/ui/floating-buttons"
import { BarChart3, TrendingUp, Leaf, Globe, Zap, Droplets, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)

  // In real implementation, get user's location from geolocation API or user settings
  const userLocation = {
    city: "Alice Springs",
    country: "NT", 
    latitude: -23.6980,
    longitude: 133.8807,
  }

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-100 dark:from-orange-950 dark:via-red-950 dark:to-amber-950">
      <AuthGuard>
        {/* Floating Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/15 dark:bg-gray-900/15 backdrop-blur-2xl border-b border-white/15">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Outback Climate Dashboard
              </h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Real-Time Global Climate Data</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Your Outback Climate Command Center
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive global environmental monitoring with AI-powered insights and wildfire risk assessment
            </p>
          </div>

          <div className="max-w-7xl mx-auto mb-16">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/20">
              <ClimateBoard location={userLocation} />
            </div>
          </div>

          {/* <div className="">
            <h3 className="text-2xl font-bold text-center mb-12 text-gray-900 dark:text-white">
              Advanced Global Environmental Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="group bg-gradient-to-br from-white/60 to-orange-50/60 dark:from-gray-800/60 dark:to-orange-900/60 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl hover:scale-105 overflow-hidden">
                <CardHeader className="pb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardTitle className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-lg font-semibold">Climate Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/40 dark:bg-gray-700/40 rounded-2xl">
                      <span className="text-sm font-medium">Temperature Trend</span>
                      <Badge className="bg-gradient-to-r from-red-100 to-orange-100 text-red-800 dark:from-red-900/50 dark:to-orange-900/50 dark:text-red-200 border-0 shadow-sm">Rising</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/40 dark:bg-gray-700/40 rounded-2xl">
                      <span className="text-sm font-medium">Bushfire Risk</span>
                      <Badge className="bg-gradient-to-r from-red-100 to-orange-100 text-red-800 dark:from-red-900/50 dark:to-orange-900/50 dark:text-red-200 border-0 shadow-sm">High</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/40 dark:bg-gray-700/40 rounded-2xl">
                      <span className="text-sm font-medium">Drought Index</span>
                      <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/50 dark:to-amber-900/50 dark:text-yellow-200 border-0 shadow-sm">Moderate</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div> */}
        </div>
      </AuthGuard>
      <FloatingButtons 
        pageTitle="Outback Climate Dashboard"
        pageContext="Real-time global environmental monitoring dashboard with wildfire risk, drought assessment, climate data, and worldwide sustainability metrics"
      />
    </div>
  )
}
