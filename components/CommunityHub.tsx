'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User, Clock, Tag } from 'lucide-react'
import { storyblokService, CommunityUpdate } from '@/lib/storyblok-service'
import { useLocation } from '@/components/ui/location-selector'
import { Skeleton } from '@/components/ui/skeleton'

export default function CommunityHub() {
  const [updates, setUpdates] = useState<CommunityUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    const fetchCommunityUpdates = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const country = location?.code || 'global'
        console.log('Fetching community updates for country:', country)
        
        // Only fetch from Storyblok for USA and India
        if (country === 'usa' || country === 'india') {
          const data = await storyblokService.getCommunityUpdates(country)
          
          if (data && data.length > 0) {
            console.log('Using Storyblok community updates:', data)
            setUpdates(data)
          } else {
            console.log('No Storyblok updates found, using fallback')
            const fallbackData = storyblokService.getFallbackCommunityUpdates(country)
            setUpdates(fallbackData)
          }
        } else {
          // Use fallback updates for other countries
          console.log('Using fallback community updates for country:', country)
          const fallbackData = storyblokService.getFallbackCommunityUpdates(country)
          setUpdates(fallbackData)
        }
      } catch (err) {
        console.error('Failed to fetch community updates:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch updates')
        
        // Use fallback updates on error
        const country = location?.code || 'global'
        const fallbackData = storyblokService.getFallbackCommunityUpdates(country)
        setUpdates(fallbackData)
      } finally {
        setLoading(false)
      }
    }

    fetchCommunityUpdates()
  }, [location])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Recent'
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    console.warn('Community Hub error:', error)
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
          <div className="w-2 h-6 bg-green-500 rounded-full"></div>
          Community Resource Hub
          <div className="ml-auto">
            <Badge variant="outline" className="text-xs">
              {location?.name || 'Global'}
            </Badge>
          </div>
        </CardTitle>
        <p className="text-sm text-green-600 dark:text-green-400">
          Latest updates from agricultural experts and extension services
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {updates.map((update, index) => (
          <Card 
            key={index} 
            className="border-l-4 border-l-green-500 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {update.update_title}
                  </h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    <Calendar className="h-3 w-3" />
                    {formatDate(update.update_date)}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {update.update_content}
                </p>
                
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span className="font-medium">{update.expert_name}</span>
                    <span className="text-gray-400">•</span>
                    <span>{update.expert_title}</span>
                  </div>
                  
                  {update.related_feature && (
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {update.related_feature}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {updates.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No community updates available at this time.</p>
            <p className="text-sm mt-1">Check back later for expert insights and resource updates.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
