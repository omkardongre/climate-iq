'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sun, Moon, Contrast } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, mounted, cycleTheme, getThemeLabel } = useTheme()

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'high-contrast':
        return <Contrast className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  const getThemeColor = () => {
    switch (theme) {
      case 'light':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'dark':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'high-contrast':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={cycleTheme}
        title={`Current: ${getThemeLabel(theme)}. Click to cycle themes.`}
      >
        {getThemeIcon()}
        {showLabel && <span className="ml-2">{getThemeLabel(theme)}</span>}
      </Button>
      
      {showLabel && (
        <Badge className={getThemeColor()}>
          {getThemeLabel(theme)}
        </Badge>
      )}
    </div>
  )
}
