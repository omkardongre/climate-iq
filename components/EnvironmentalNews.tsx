'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ExternalLink, Newspaper, Tag } from 'lucide-react'
import { storyblokService, NewsItem } from '@/lib/storyblok-service'
import { useLocation } from '@/components/ui/location-selector'
import { Skeleton } from '@/components/ui/skeleton'

export default function EnvironmentalNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const country = location?.code || 'global'
        console.log('Fetching latest news for country:', country)
        
        // Only fetch from Storyblok for USA and India
        if (country === 'usa' || country === 'india') {
          const data = await storyblokService.getLatestNews(country)
          
          if (data && data.length > 0) {
            console.log('Using Storyblok latest news:', data)
            setNews(data)
          } else {
            console.log('No Storyblok news found, using fallback')
            const fallbackData = storyblokService.getFallbackNews(country)
            setNews(fallbackData)
          }
        } else {
          // Use fallback news for other countries
          console.log('Using fallback latest news for country:', country)
          const fallbackData = storyblokService.getFallbackNews(country)
          setNews(fallbackData)
        }
      } catch (err) {
        console.error('Failed to fetch latest news:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch news')
        
        // Use fallback news on error
        const country = location?.code || 'global'
        const fallbackData = storyblokService.getFallbackNews(country)
        setNews(fallbackData)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestNews()
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Government Scheme': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Policy Update': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Research News': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Technology Update': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Climate Alert': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const isRecent = (dateString: string) => {
    try {
      const newsDate = new Date(dateString)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return newsDate > weekAgo
    } catch {
      return false
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="border-l-4 border-l-orange-500">
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
    console.warn('Environmental News error:', error)
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
          <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
          Latest Environmental News
          <div className="ml-auto">
            <Badge variant="outline" className="text-xs">
              {location?.name || 'Global'}
            </Badge>
          </div>
        </CardTitle>
        <p className="text-sm text-orange-600 dark:text-orange-400">
          Recent updates on environmental policies and initiatives
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {news.map((item, index) => (
          <Card 
            key={index} 
            className="border-l-4 border-l-orange-500 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {item.news_title}
                  </h4>
                  <div className="flex items-center gap-2 shrink-0">
                    {isRecent(item.publication_date) && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                    <Badge 
                      className={`text-xs ${getCategoryColor(item.news_category)}`}
                    >
                      {item.news_category}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.news_summary}
                </p>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.publication_date)}
                  </div>
                  
                  {item.source_url && item.source_url !== '#' && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 text-xs"
                    >
                      <a 
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Read More
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {news.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No environmental news available at this time.</p>
            <p className="text-sm mt-1">Check back later for the latest updates and announcements.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
