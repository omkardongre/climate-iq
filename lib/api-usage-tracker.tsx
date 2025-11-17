"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, Cloud, AlertTriangle, CheckCircle } from "lucide-react"

interface APIUsage {
  service: string
  used: number
  limit: number
  resetTime: number
  status: 'safe' | 'warning' | 'limited'
}

export function APIUsageTracker() {
  const [usage, setUsage] = useState<APIUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUsage = async () => {
      try {
        // Import services to check usage
        const { geminiService } = await import("@/lib/gemini-service")
        const { openWeatherService } = await import("@/lib/openweather-service")

        const geminiRemaining = geminiService.getRemainingCalls()
        const weatherRemaining = openWeatherService.getRemainingCalls()

        const maxGemini = parseInt(process.env.MAX_GEMINI_CALLS_PER_HOUR || '10')
        const maxWeather = parseInt(process.env.MAX_OPENWEATHER_CALLS_PER_HOUR || '20')

        const usageData: APIUsage[] = [
          {
            service: 'Google Gemini',
            used: maxGemini - geminiRemaining,
            limit: maxGemini,
            resetTime: geminiService.getResetTime(),
            status: geminiRemaining > 3 ? 'safe' : geminiRemaining > 0 ? 'warning' : 'limited'
          },
          {
            service: 'OpenWeather',
            used: maxWeather - weatherRemaining,
            limit: maxWeather,
            resetTime: 0, // OpenWeather resets daily
            status: weatherRemaining > 5 ? 'safe' : weatherRemaining > 0 ? 'warning' : 'limited'
          }
        ]

        setUsage(usageData)
      } catch (error) {
        console.error('Error checking API usage:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUsage()
    const interval = setInterval(checkUsage, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'limited':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Zap className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'limited':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Cloud className="h-6 w-6 animate-pulse text-blue-500" />
            <span className="ml-2 text-sm">Checking API usage...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          API Usage Monitor
        </CardTitle>
        <CardDescription>
          Hackathon-safe API limits to stay within free tiers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {usage.map((api, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(api.status)}
                <span className="font-medium">{api.service}</span>
              </div>
              <Badge className={getStatusColor(api.status)}>
                {api.used}/{api.limit} calls
              </Badge>
            </div>
            <Progress 
              value={(api.used / api.limit) * 100} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{api.limit - api.used} calls remaining</span>
              {api.resetTime > 0 && (
                <span>Resets in {Math.ceil(api.resetTime / (1000 * 60))} min</span>
              )}
            </div>
          </div>
        ))}

        {usage.some(api => api.status === 'limited') && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some APIs are temporarily limited. Features will use cached data until limits reset.
            </AlertDescription>
          </Alert>
        )}

        {usage.some(api => api.status === 'warning') && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Approaching API limits. Consider using features sparingly to preserve quota.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
