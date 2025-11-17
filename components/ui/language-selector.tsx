'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Languages, ChevronDown } from 'lucide-react'
import { translationService } from '@/lib/translation-service'

interface LanguageSelectorProps {
  onLanguageChange: (languageCode: string) => void
  currentLanguage?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LanguageSelector({ 
  onLanguageChange, 
  currentLanguage = 'en',
  size = 'md' 
}: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage)
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    ...translationService.getLanguageOptions()
  ]

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode)
    onLanguageChange(languageCode)
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { code: languageCode }
    }))
  }

  const currentLang = languages.find(lang => lang.code === selectedLanguage) || languages[0]

  const buttonSizes = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`${buttonSizes[size]} flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white/90`}
          aria-label="Select language"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.flag}</span>
          <span className="hidden md:inline">{currentLang.name.split(' ')[0]}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto z-50">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            className={`flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
              selectedLanguage === language.code ? 'bg-blue-50 dark:bg-blue-950' : ''
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <span className="flex-1">{language.name}</span>
            {selectedLanguage === language.code && (
              <span className="text-blue-600 dark:text-blue-400">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
