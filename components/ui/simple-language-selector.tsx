'use client'

import { useState } from 'react'
import { ChevronDown, Languages } from 'lucide-react'

interface Language {
  code: string
  name: string
  flag: string
}

interface SimpleLanguageSelectorProps {
  onLanguageChange: (languageCode: string) => void
  currentLanguage?: string
  size?: 'sm' | 'md' | 'lg'
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese (Português)', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese (中文)', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺' },
  { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷' }
]

export function SimpleLanguageSelector({ 
  onLanguageChange, 
  currentLanguage = 'en',
  size = 'md' 
}: SimpleLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage)
  
  const currentLang = languages.find(lang => lang.code === selectedLanguage) || languages[0]

  const handleLanguageSelect = (languageCode: string) => {
    console.log('Language selected:', languageCode)
    setSelectedLanguage(languageCode)
    onLanguageChange(languageCode)
    setIsOpen(false)
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { code: languageCode }
    }))
  }

  const buttonSizes = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  }

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        onClick={() => {
          console.log('Language selector clicked, current state:', isOpen)
          setIsOpen(!isOpen)
        }}
        className={`${buttonSizes[size]} flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Languages className="h-4 w-4 text-gray-600" />
        <span className="hidden sm:inline text-lg">{currentLang.flag}</span>
        <span className="hidden md:inline text-gray-700 font-medium">
          {currentLang.name.split(' ')[0]}
        </span>
        <ChevronDown 
          className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-64 overflow-y-auto">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150 ${
                  selectedLanguage === language.code 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700'
                }`}
                role="option"
                aria-selected={selectedLanguage === language.code}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="flex-1 font-medium">{language.name}</span>
                {selectedLanguage === language.code && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
