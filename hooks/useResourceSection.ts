'use client'

import { useState, useEffect } from 'react'
import { storyblokService, ResourceSection } from '@/lib/storyblok-service'
import { useLocation } from '@/components/ui/location-selector'

export function useResourceSection(featureName: string) {
  const [resourceData, setResourceData] = useState<ResourceSection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    async function fetchResourceSection() {
      try {
        setLoading(true)
        setError(null)
        
        // Get country from location selector, fallback to usa
        const country = location?.code || 'usa'
        
        // Fetch resource section from Storyblok
        const data = await storyblokService.getResourceSection(country, featureName)
        
        if (data) {
          setResourceData(data)
        } else {
          // Use fallback data if Storyblok fails
          const fallbackData = storyblokService.getFallbackResourceSection(country, featureName)
          setResourceData(fallbackData)
        }
      } catch (err) {
        console.error(`Failed to fetch resource section for ${featureName}:`, err)
        setError(err instanceof Error ? err.message : 'Failed to fetch resources')
        
        // Use fallback data on error
        const country = location?.code || 'usa'
        const fallbackData = storyblokService.getFallbackResourceSection(country, featureName)
        setResourceData(fallbackData)
      } finally {
        setLoading(false)
      }
    }

    if (featureName) {
      fetchResourceSection()
    }
  }, [featureName, location])

  return { resourceData, loading, error }
}
