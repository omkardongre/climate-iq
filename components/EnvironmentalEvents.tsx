'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, ExternalLink, Clock, Tag } from 'lucide-react'
import { storyblokService, EventItem } from '@/lib/storyblok-service'
import { useLocation } from '@/components/ui/location-selector'
import { Skeleton } from '@/components/ui/skeleton'

export default function EnvironmentalEvents() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    const fetchEnvironmentalEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const country = location?.code || 'global'
        console.log('Fetching environmental events for country:', country)
        
        // Only fetch from Storyblok for USA and India
        if (country === 'usa' || country === 'india') {
          const data = await storyblokService.getEnvironmentalEvents(country)
          
          if (data && data.length > 0) {
            console.log('Using Storyblok environmental events:', data)
            setEvents(data)
          } else {
            console.log('No Storyblok events found, using fallback')
            const fallbackData = storyblokService.getFallbackEvents(country)
            setEvents(fallbackData)
          }
        } else {
          // Use fallback events for other countries
          console.log('Using fallback environmental events for country:', country)
          const fallbackData = storyblokService.getFallbackEvents(country)
          setEvents(fallbackData)
        }
      } catch (err) {
        console.error('Failed to fetch environmental events:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch events')
        
        // Use fallback events on error
        const country = location?.code || 'global'
        const fallbackData = storyblokService.getFallbackEvents(country)
        setEvents(fallbackData)
      } finally {
        setLoading(false)
      }
    }

    fetchEnvironmentalEvents()
  }, [location])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'TBD'
    }
  }

  const isUpcoming = (dateString: string) => {
    try {
      return new Date(dateString) > new Date()
    } catch {
      return true
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Conference': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Workshop': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Webinar': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Training': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Policy Update': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="border-l-4 border-l-blue-500">
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
    console.warn('Environmental Events error:', error)
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
          <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
          Environmental Events
          <div className="ml-auto">
            <Badge variant="outline" className="text-xs">
              {location?.name || 'Global'}
            </Badge>
          </div>
        </CardTitle>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Upcoming conferences, workshops, and training programs
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event, index) => (
          <Card 
            key={index} 
            className="border-l-4 border-l-blue-500 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {event.event_title}
                  </h4>
                  <Badge 
                    className={`text-xs shrink-0 ${getCategoryColor(event.event_category)}`}
                  >
                    {event.event_category}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {event.event_description}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(event.event_date)}</span>
                    {isUpcoming(event.event_date) && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Upcoming
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{event.event_location}</span>
                  </div>
                </div>
                
                {event.registration_url && event.registration_url !== '#' && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 text-xs"
                    >
                      <a 
                        href={event.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Register Now
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No environmental events scheduled at this time.</p>
            <p className="text-sm mt-1">Check back later for upcoming conferences and workshops.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
