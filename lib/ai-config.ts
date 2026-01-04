/**
 * AI Service Configuration for Mux AI Features
 * 
 * This module configures the @mux/ai SDK for:
 * - AI Chapter Generation (using Google Gemini)
 * - Caption Translation
 * - Audio Dubbing (using ElevenLabs)
 */

// Environment variable validation
export function validateAIConfig() {
  const required = [
    'MUX_TOKEN_ID',
    'MUX_TOKEN_SECRET',
  ];

  const optional = [
    'GOOGLE_GEMINI_API_KEY', // For AI chapters
    'OPENAI_API_KEY',        // Alternative for AI chapters
    'ELEVENLABS_API_KEY',    // For audio dubbing
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const available = optional.filter(key => process.env[key]);
  
  return {
    hasGemini: !!process.env.GOOGLE_GEMINI_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasElevenLabs: !!process.env.ELEVENLABS_API_KEY,
    availableProviders: available,
  };
}

// Supported languages for translation
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'fr', name: 'French' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// AI Provider types
export type AIProvider = 'gemini' | 'openai' | 'anthropic';

// Chapter interface matching Mux Player expectations
export interface VideoChapter {
  startTime: number;
  endTime: number;
  title: string;
}

// Translation result interface
export interface TranslationResult {
  success: boolean;
  trackId?: string;
  language: LanguageCode;
  error?: string;
}

// Audio dubbing result interface
export interface DubbingResult {
  success: boolean;
  trackId?: string;
  language: LanguageCode;
  audioUrl?: string;
  error?: string;
}
