'use client'

import { useCountryTheme } from '@/hooks/useCountryTheme'
import { Skeleton } from '@/components/ui/skeleton'

interface DynamicHomepageThemeProps {
  children: (themeData: any, country: string) => React.ReactNode
  fallbackContent: React.ReactNode
}

export default function DynamicHomepageTheme({ 
  children, 
  fallbackContent 
}: DynamicHomepageThemeProps) {
  const { themeData, loading, country } = useCountryTheme()

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  // If we have Storyblok theme data, use it
  if (themeData) {
    return <>{children(themeData, country)}</>
  }

  // Otherwise, show fallback content
  return <>{fallbackContent}</>
}
