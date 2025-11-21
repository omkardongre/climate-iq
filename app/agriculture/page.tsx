"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sprout, Droplets, Leaf, MessageSquare, Calendar, MapPin, ExternalLink, Users, Newspaper, CalendarDays, Loader2, Sun } from 'lucide-react';
import { CropPlanner } from '@/components/agriculture/CropPlanner';
import { CarbonTracker } from '@/components/agriculture/CarbonTracker';
import { SolarIrrigationCalculator } from '@/components/agriculture/SolarIrrigationCalculator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { storyblokService } from '@/lib/storyblok-service';
import type { CommunityUpdate, EventItem, NewsItem } from '@/lib/storyblok-service';
import { useCountryTheme } from '@/hooks/useCountryTheme';
import Image from 'next/image';

export default function AgriculturePage() {
  const [activeTab, setActiveTab] = useState('crop-planner');
  const [communityUpdates, setCommunityUpdates] = useState<CommunityUpdate[]>([]);
  const [environmentalEvents, setEnvironmentalEvents] = useState<EventItem[]>([]);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const { country } = useCountryTheme();

  useEffect(() => {
    if (activeTab === 'community') {
      fetchCommunityData();
    }
  }, [activeTab, country]);

  const fetchCommunityData = async () => {
    setLoadingCommunity(true);
    try {
      const [updates, events, news] = await Promise.all([
        storyblokService.getCommunityUpdates(country, 'en'),
        storyblokService.getEnvironmentalEvents(country, 'en'),
        storyblokService.getLatestNews(country, 'en')
      ]);
      
      setCommunityUpdates(updates);
      setEnvironmentalEvents(events);
      setLatestNews(news);
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoadingCommunity(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Sprout className="h-10 w-10 text-green-600" />
          Smart Agriculture Hub
        </h1>
        <p className="text-muted-foreground text-lg">
          AI-powered tools to help farmers make data-driven decisions for sustainable agriculture
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 lg:grid-cols-4 h-auto">
          <TabsTrigger value="crop-planner" className="flex items-center gap-2 py-3">
            <Sprout className="h-4 w-4" />
            <span className="hidden sm:inline">AI Crop Planner</span>
            <span className="sm:hidden">Crops</span>
          </TabsTrigger>
          <TabsTrigger value="carbon" className="flex items-center gap-2 py-3">
            <Leaf className="h-4 w-4" />
            <span className="hidden sm:inline">Carbon Tracker</span>
            <span className="sm:hidden">Carbon</span>
          </TabsTrigger>
          <TabsTrigger value="solar" className="flex items-center gap-2 py-3">
            <Sun className="h-4 w-4" />
            <span className="hidden sm:inline">Solar Irrigation</span>
            <span className="sm:hidden">Solar</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2 py-3">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Community</span>
            <span className="sm:hidden">Forum</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Crop Planner Tab */}
        <TabsContent value="crop-planner" className="space-y-6">
          <CropPlanner />
        </TabsContent>

        {/* Carbon Tracker Tab */}
        <TabsContent value="carbon" className="space-y-6">
          <CarbonTracker />
        </TabsContent>

        {/* Solar Irrigation Tab */}
        <TabsContent value="solar" className="space-y-6">
          <SolarIrrigationCalculator />
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-6">
          <Tabs defaultValue="updates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="updates" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Community Updates
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                Latest News
              </TabsTrigger>
            </TabsList>

            {/* Community Updates */}
            <TabsContent value="updates" className="space-y-4 mt-6">
              {loadingCommunity ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              ) : communityUpdates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {communityUpdates.map((update, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold text-green-700">
                            {update.update_title}
                          </CardTitle>
                          {update.related_feature && (
                            <Badge variant="secondary">{update.related_feature}</Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          By {update.expert_name}, {update.expert_title}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {update.update_content}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(update.update_date)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No community updates available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Environmental Events */}
            <TabsContent value="events" className="space-y-4 mt-6">
              {loadingCommunity ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : environmentalEvents.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {environmentalEvents.map((event, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden">
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
                          <CardTitle className="text-lg font-semibold text-blue-700">
                            {event.event_title}
                          </CardTitle>
                          <Badge variant="outline">{event.event_category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {event.event_description}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-2" />
                            {formatDate(event.event_date)}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-2" />
                            {event.event_location}
                          </div>
                        </div>
                        {event.registration_url && (
                          <Button asChild size="sm" className="w-full">
                            <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Register Now
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No events available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Latest News */}
            <TabsContent value="news" className="space-y-4 mt-6">
              {loadingCommunity ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
              ) : latestNews.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {latestNews.map((news, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold text-orange-700">
                            {news.news_title}
                          </CardTitle>
                          <Badge variant="secondary">{news.news_category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {news.news_summary}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(news.publication_date)}
                          </div>
                          {news.source_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={news.source_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Read More
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No news available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
