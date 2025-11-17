'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'

interface CustomThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: CustomThemeProviderProps) {
  const { theme, mounted } = useTheme()

  useEffect(() => {
    if (mounted) {
      // Theme is already applied by useTheme hook
    }
  }, [mounted, theme])

  return <>{children}</>
}
