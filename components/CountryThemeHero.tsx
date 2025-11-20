'use client'

import { useCountryTheme } from '@/hooks/useCountryTheme'
import { Button } from '@/components/ui/button'
import { ArrowRight, Globe } from 'lucide-react'
import Link from 'next/link'

interface CountryThemeHeroProps {
  defaultTitle?: string
  defaultSubtitle?: string
  defaultImage?: string
}

export default function CountryThemeHero({
  defaultTitle = "AI-Powered Climate Solutions",
  defaultSubtitle = "Empowering communities worldwide with intelligent environmental tools and insights",
  defaultImage = "/images/global-climate.jpg"
}: CountryThemeHeroProps) {
  const { themeData, loading, country } = useCountryTheme()

  // Use Storyblok data if available, otherwise use defaults
  const heroTitle = themeData?.hero_title || defaultTitle
  const heroSubtitle = themeData?.hero_subtitle || defaultSubtitle
  const heroImage = themeData?.hero_image?.filename || defaultImage
  const welcomeMessage = themeData?.welcome_message

  const getCountryFlag = (countryCode: string) => {
    switch (countryCode) {
      case 'usa': return '🇺🇸'
      case 'india': return '🇮🇳'
      default: return '🌍'
    }
  }

  const getCountryName = (countryCode: string) => {
    switch (countryCode) {
      case 'usa': return 'United States'
      case 'india': return 'India'
      default: return 'Global'
    }
  }

  if (loading) {
    return (
      <div className="relative h-[500px] bg-gradient-to-r from-green-600 to-blue-600 animate-pulse">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white space-y-4 max-w-4xl mx-auto px-4">
            <div className="h-12 bg-white/20 rounded w-3/4 mx-auto" />
            <div className="h-6 bg-white/20 rounded w-full" />
            <div className="h-6 bg-white/20 rounded w-2/3 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[500px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white space-y-6 max-w-4xl mx-auto px-4">
          {/* Country Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
            <Globe className="h-4 w-4" />
            <span>{getCountryFlag(country)} {getCountryName(country)}</span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            {heroTitle}
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
            {heroSubtitle}
          </p>
          
          {/* Welcome Message (if available from Storyblok) */}
          {welcomeMessage && (
            <p className="text-lg text-green-200 bg-green-900/30 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto">
              {welcomeMessage}
            </p>
          )}
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
              <Link href="/chat">
                Start Climate Chat
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900">
              <Link href="/bushfire-risk">
                Explore Tools
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
