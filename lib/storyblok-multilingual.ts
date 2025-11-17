import { getStoryblokApi } from './storyblok'

export interface StoryblokLanguageConfig {
  code: string
  name: string
  isDefault: boolean
}

class StoryblokMultilingualService {
  private getApi() {
    return getStoryblokApi()
  }

  // Get available languages from Storyblok space
  async getAvailableLanguages(): Promise<StoryblokLanguageConfig[]> {
    try {
      const { data } = await this.getApi().get('cdn/spaces/me')
      
      if (data?.space?.language_codes) {
        return data.space.language_codes.map((lang: any) => ({
          code: lang.code,
          name: lang.name,
          isDefault: lang.code === data.space.default_lang_name
        }))
      }
      
      // Fallback to default English if no languages configured
      return [{ code: 'en', name: 'English', isDefault: true }]
    } catch (error) {
      console.error('Failed to fetch available languages:', error)
      return [{ code: 'en', name: 'English', isDefault: true }]
    }
  }

  // Check if Storyblok space has internationalization enabled
  async hasInternationalizationEnabled(): Promise<boolean> {
    try {
      const languages = await this.getAvailableLanguages()
      return languages.length > 1
    } catch (error) {
      console.error('Failed to check internationalization status:', error)
      return false
    }
  }

  // Get story with specific language
  async getStoryWithLanguage(slug: string, language: string = 'en') {
    try {
      const params: any = {
        version: 'published'
      }

      // Only add language parameter if it's not the default language
      if (language !== 'en') {
        params.language = language
        params.fallback_lang = 'en'
      }

      const { data } = await this.getApi().get(`cdn/stories/${slug}`, params)
      return data
    } catch (error) {
      console.error(`Failed to fetch story ${slug} in language ${language}:`, error)
      return null
    }
  }

  // Get stories collection with language support
  async getStoriesWithLanguage(params: any, language: string = 'en') {
    try {
      const apiParams: any = {
        ...params,
        version: 'published'
      }

      // Only add language parameter if it's not the default language
      if (language !== 'en') {
        apiParams.language = language
        apiParams.fallback_lang = 'en'
      }

      const { data } = await this.getApi().get('cdn/stories', apiParams)
      return data
    } catch (error) {
      console.error('Failed to fetch stories with language:', error)
      return { stories: [] }
    }
  }

  // Check if a specific field is translatable in Storyblok
  isFieldTranslatable(fieldValue: any, language: string): boolean {
    // In Storyblok, translatable fields can have different values per language
    // Non-translatable fields will be the same across all languages
    return typeof fieldValue === 'object' && fieldValue !== null && fieldValue[language]
  }

  // Get translated field value with fallback
  getTranslatedField(fieldValue: any, language: string, fallbackLanguage: string = 'en'): string {
    if (typeof fieldValue === 'string') {
      // Non-translatable field, return as-is
      return fieldValue
    }

    if (typeof fieldValue === 'object' && fieldValue !== null) {
      // Translatable field, try to get language-specific value
      return fieldValue[language] || fieldValue[fallbackLanguage] || fieldValue.en || ''
    }

    return fieldValue || ''
  }
}

export const storyblokMultilingualService = new StoryblokMultilingualService()
