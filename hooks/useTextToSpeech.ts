'use client'

import { useState, useCallback, useRef } from 'react'

interface TTSOptions {
  rate?: number
  pitch?: number
  volume?: number
  voice?: SpeechSynthesisVoice | null
}

interface TTSControls {
  speak: (text: string, options?: TTSOptions) => void
  stop: () => void
  pause: () => void
  resume: () => void
  cancel: () => void
  isSpeaking: boolean
  isPaused: boolean
  isSupported: boolean
  voices: SpeechSynthesisVoice[]
  currentUtterance: SpeechSynthesisUtterance | null
}

export function useTextToSpeech(): TTSControls {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Initialize TTS support and voices
  const initializeTTS = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices()
        setVoices(availableVoices)
      }

      // Load voices immediately if available
      loadVoices()
      
      // Also listen for voices changed event (some browsers load voices asynchronously)
      speechSynthesis.addEventListener('voiceschanged', loadVoices)
      
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      }
    } else {
      setIsSupported(false)
      console.warn('Speech synthesis not supported in this browser')
    }
  }, [])

  // Initialize on first render
  useState(() => {
    initializeTTS()
  })

  const speak = useCallback((text: string, options: TTSOptions = {}) => {
    if (!isSupported || !text.trim()) {
      console.warn('TTS not supported or empty text provided')
      return
    }

    // Cancel any existing speech
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Set options with defaults
    utterance.rate = options.rate ?? 0.9
    utterance.pitch = options.pitch ?? 1.0
    utterance.volume = options.volume ?? 0.8
    
    // Set voice if provided, otherwise use default
    if (options.voice) {
      utterance.voice = options.voice
    } else if (voices.length > 0) {
      // Try to find a good English voice
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.localService
      ) || voices.find(voice => voice.lang.startsWith('en'))
      
      if (englishVoice) {
        utterance.voice = englishVoice
      }
    }

    // Set up event handlers
    utterance.onstart = () => {
      console.log('TTS started')
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      console.log('TTS ended')
      setIsSpeaking(false)
      setIsPaused(false)
      setCurrentUtterance(null)
      utteranceRef.current = null
    }

    utterance.onerror = (event) => {
      console.error('TTS error:', event.error)
      setIsSpeaking(false)
      setIsPaused(false)
      setCurrentUtterance(null)
      utteranceRef.current = null
    }

    utterance.onpause = () => {
      console.log('TTS paused')
      setIsPaused(true)
    }

    utterance.onresume = () => {
      console.log('TTS resumed')
      setIsPaused(false)
    }

    // Store utterance reference
    utteranceRef.current = utterance
    setCurrentUtterance(utterance)

    // Start speaking
    try {
      speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Error starting TTS:', error)
      setIsSpeaking(false)
      setCurrentUtterance(null)
      utteranceRef.current = null
    }
  }, [isSupported, voices])

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
      setCurrentUtterance(null)
      utteranceRef.current = null
    }
  }, [isSupported])

  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      speechSynthesis.pause()
      setIsPaused(true)
    }
  }, [isSupported, isSpeaking, isPaused])

  const resume = useCallback(() => {
    if (isSupported && isSpeaking && isPaused) {
      speechSynthesis.resume()
      setIsPaused(false)
    }
  }, [isSupported, isSpeaking, isPaused])

  const cancel = useCallback(() => {
    stop()
  }, [stop])

  return {
    speak,
    stop,
    pause,
    resume,
    cancel,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    currentUtterance
  }
}
