'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, MapPin, ExternalLink, Users, Newspaper, CalendarDays, BookOpen, Award, Video } from 'lucide-react'
import { storyblokService } from '@/lib/storyblok-service'
import type { CommunityUpdate, EventItem, NewsItem } from '@/lib/storyblok-service'
import { SimpleLanguageSelector } from '@/components/ui/simple-language-selector'
import { translationService } from '@/lib/translation-service'
import { useCountryTheme } from '@/hooks/useCountryTheme'
import Image from 'next/image'
import { LearningModules } from '@/components/community/LearningModules'
import { ClimateStoriesTab } from '@/components/community/ClimateStoriesTab'

export default function CommunityPage() {
  const [communityUpdates, setCommunityUpdates] = useState<CommunityUpdate[]>([])
  const [environmentalEvents, setEnvironmentalEvents] = useState<EventItem[]>([])
  const [latestNews, setLatestNews] = useState<NewsItem[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [loading, setLoading] = useState(true)
  const [translations, setTranslations] = useState<any>({})
  const { country } = useCountryTheme()

  useEffect(() => {
    const fetchCommunityData = async () => {
      setLoading(true)
      try {
        const [updates, events, news] = await Promise.all([
          storyblokService.getCommunityUpdates(country, selectedLanguage),
          storyblokService.getEnvironmentalEvents(country, selectedLanguage),
          storyblokService.getLatestNews(country, selectedLanguage)
        ])
        
        setCommunityUpdates(updates)
        setEnvironmentalEvents(events)
        setLatestNews(news)
      } catch (error) {
        console.error('Error fetching community data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCommunityData()
  }, [country, selectedLanguage])

  useEffect(() => {
    const loadTranslations = async () => {
      if (selectedLanguage !== 'en') {
        console.log('Language changed to:', selectedLanguage, '- Content should load from Storyblok with language parameter')
        // Note: UI translations are handled by Storyblok content with language parameter
        // Only translate static UI elements that are not from Storyblok
        const staticUITranslations = {
          'Community & Environmental Hub': 'Community & Environmental Hub',
          'Stay connected with expert insights, upcoming events, and the latest environmental news': 'Stay connected with expert insights, upcoming events, and the latest environmental news',
          'Community Updates': 'Community Updates',
          'Environmental Events': 'Environmental Events', 
          'Latest News': 'Latest News',
          'No updates available': 'No updates available',
          'No events available': 'No events available',
          'No news available': 'No news available',
          'Loading...': 'Loading...'
        }
        
        // Only translate if Storyblok doesn't have translations configured
        // In production, these would come from Storyblok with proper language parameter
        setTranslations(staticUITranslations)
      } else {
        setTranslations({})
      }
    }

    loadTranslations()
  }, [selectedLanguage])

  const t = (key: string) => translations[key] || key

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SimpleLanguageSelector 
              onLanguageChange={(lang: string) => {
                console.log('Language selector clicked, changing to:', lang)
                setSelectedLanguage(lang)
              }}
              currentLanguage={selectedLanguage}
              size="md"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('Community & Environmental Hub')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('Stay connected with expert insights, upcoming events, and the latest environmental news')}
          </p>
        </div>

        {/* Current Country Display */}
        {/* <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md">
            <div className="flex items-center gap-2 text-lg font-medium">
              <span>📍 Showing content for:</span>
              <span className="text-blue-600 dark:text-blue-400">
                {country === 'usa' ? '🇺🇸 United States' : 
                 country === 'india' ? '🇮🇳 India' : 
                 `🌍 ${country.toUpperCase()}`}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {country === 'usa' || country === 'india' ? 
                'Content from Storyblok CMS' : 
                'Fallback content (change location on home page for CMS content)'}
            </p>
          </div>
        </div> */}

        {/* Main Content Tabs */}
        <Tabs defaultValue="stories" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="stories" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              {t('Climate Stories')}
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('Updates')}
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {t('Events')}
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              {t('News')}
            </TabsTrigger>
            <TabsTrigger value="learn" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('Learn')}
            </TabsTrigger>
          </TabsList>

          {/* Climate Stories Tab - NEW Mux-powered feature */}
          <TabsContent value="stories" className="space-y-6">
            <ClimateStoriesTab />
          </TabsContent>

          {/* Community Updates Tab */}
          <TabsContent value="updates" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('Community Resource Updates')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {t('Latest updates from agricultural experts and extension services')}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {communityUpdates.map((update, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-green-700 dark:text-green-400">
                          {update.update_title}
                        </CardTitle>
                        {update.related_feature && (
                          <Badge variant="secondary" className="ml-2">
                            {update.related_feature}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm text-gray-500">
                        By {update.expert_name}, {update.expert_title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {update.update_content}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(update.update_date)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Environmental Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('Environmental Events')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {t('Upcoming conferences, workshops, and training programs')}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {environmentalEvents.map((event, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                    {event.event_image && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={event.event_image}
                          alt={event.event_title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                          {event.event_title}
                        </CardTitle>
                        <Badge variant="outline" className="ml-2">
                          {event.event_category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {event.event_description}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(event.event_date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2" />
                          {event.event_location}
                        </div>
                      </div>
                      {event.registration_url && (
                        <Button asChild className="w-full">
                          <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('Register Now')}
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Latest News Tab */}
          <TabsContent value="news" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('Latest Environmental News')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {t('Recent updates on environmental policies and initiatives')}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestNews.map((news, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-orange-700 dark:text-orange-400">
                          {news.news_title}
                        </CardTitle>
                        <Badge variant="secondary" className="ml-2">
                          {news.news_category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {news.news_summary}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(news.publication_date)}
                        </div>
                        {news.source_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={news.source_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              {t('Read More')}
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Educational AI Coach Tab */}
          <TabsContent value="learn" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                📚 {t('Educational AI Coach')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {t('Learn about climate change through interactive lessons')}
              </p>
            </div>

            <LearningModules />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
