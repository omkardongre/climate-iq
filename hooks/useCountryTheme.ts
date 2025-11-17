'use client'

import { useState, useEffect } from 'react'
import { storyblokService, CountryTheme } from '@/lib/storyblok-service'
import { useLocation } from '@/components/ui/location-selector'

export function useCountryTheme() {
  const [themeData, setThemeData] = useState<CountryTheme | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    async function fetchCountryTheme() {
      try {
        setLoading(true)
        setError(null)
        
        // Get country from location selector, fallback to usa
        const country = location?.code || 'usa'
        console.log('Fetching theme for country:', country)
        
        // Only fetch from Storyblok for USA and India
        if (country === 'usa' || country === 'india') {
          const data = await storyblokService.getCountryTheme(country)
          
          if (data) {
            // console.log('Using Storyblok theme data:', data)
            setThemeData(data)
          } else {
            console.log('Storyblok theme not found, using fallback')
            const fallbackData = storyblokService.getFallbackCountryTheme(country)
            setThemeData(fallbackData)
          }
        } else {
          // Use fallback theme for other countries
          console.log('Using fallback theme for country:', country)
          const fallbackData = storyblokService.getFallbackCountryTheme(country)
          setThemeData(fallbackData)
        }
      } catch (err) {
        console.error(`Failed to fetch country theme for ${location?.code}:`, err)
        setError(err instanceof Error ? err.message : 'Failed to fetch theme')
        
        // Use fallback theme on error
        const country = location?.code || 'usa'
        const fallbackData = storyblokService.getFallbackCountryTheme(country)
        setThemeData(fallbackData)
      } finally {
        setLoading(false)
      }
    }

    fetchCountryTheme()
  }, [location])

  return { themeData, loading, error, country: location?.code || 'usa' }
}
