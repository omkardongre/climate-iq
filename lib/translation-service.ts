import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  context?: string;
}

export interface TranslatedResourceSection {
  feature_name: string;
  country: string;
  section_1: TranslatedResourceCategory[];
  section_2: TranslatedResourceCategory[];
}

export interface TranslatedResourceCategory {
  category_title: string;
  resource_items: TranslatedResourceItem[];
}

export interface TranslatedResourceItem {
  item_name: string;
  description?: string;
  website_url?: string;
  contact_info?: string;
}

class TranslationService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  async translateText({ text, targetLanguage, context }: TranslationRequest): Promise<string> {
    try {
      const prompt = `
Translate the following text to ${targetLanguage}. 
${context ? `Context: ${context}` : ''}

Text to translate: "${text}"

Requirements:
- Maintain the original meaning and tone
- Use appropriate formal/informal register for the target language
- For technical terms, provide the most commonly used translation
- If translating government program names, keep the original name in parentheses

Provide only the translation, no additional text.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text if translation fails
    }
  }

  async translateResourceSection(
    resourceSection: any, 
    targetLanguage: string
  ): Promise<TranslatedResourceSection> {
    try {
      const translateCategory = async (category: any): Promise<TranslatedResourceCategory> => {
        const translatedTitle = await this.translateText({
          text: category.category_title,
          targetLanguage,
          context: 'Resource category title for climate/environmental resources'
        });

        const translatedItems = await Promise.all(
          category.resource_items.map(async (item: any): Promise<TranslatedResourceItem> => {
            const [translatedName, translatedDescription] = await Promise.all([
              this.translateText({
                text: item.item_name,
                targetLanguage,
                context: 'Government program or organization name'
              }),
              item.description ? this.translateText({
                text: item.description,
                targetLanguage,
                context: 'Description of government program or environmental resource'
              }) : undefined
            ]);

            return {
              item_name: translatedName,
              description: translatedDescription,
              website_url: item.website_url,
              contact_info: item.contact_info
            };
          })
        );

        return {
          category_title: translatedTitle,
          resource_items: translatedItems
        };
      };

      const [section1, section2] = await Promise.all([
        resourceSection.section_1?.[0] ? translateCategory(resourceSection.section_1[0]) : null,
        resourceSection.section_2?.[0] ? translateCategory(resourceSection.section_2[0]) : null
      ]);

      return {
        feature_name: resourceSection.feature_name,
        country: resourceSection.country,
        section_1: section1 ? [section1] : [],
        section_2: section2 ? [section2] : []
      };
    } catch (error) {
      console.error('Resource section translation failed:', error);
      return resourceSection; // Return original if translation fails
    }
  }

  async translatePage(textMap: Record<string, string>, targetLanguage: string): Promise<Record<string, string>> {
    try {
      const translations: Record<string, string> = {}
      
      for (const [key, text] of Object.entries(textMap)) {
        translations[key] = await this.translateText({
          text,
          targetLanguage,
          context: 'UI text for community hub page'
        })
      }
      
      return translations
    } catch (error) {
      console.error('Page translation failed:', error)
      return textMap // Return original if translation fails
    }
  }

  getLanguageOptions() {
    return [
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
    ];
  }
}

export const translationService = new TranslationService();
