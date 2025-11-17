'use client'

import { useState, useEffect, useRef } from 'react'

interface UseSimpleVoiceRecordingReturn {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  isSupported: boolean
  error: string | null
}

export function useSimpleVoiceRecording(): UseSimpleVoiceRecordingReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    let recognitionInstance = null
    
    if (typeof window !== 'undefined') {
      if ('webkitSpeechRecognition' in window) {
        recognitionInstance = new (window as any).webkitSpeechRecognition()
      } else if ('SpeechRecognition' in window) {
        recognitionInstance = new (window as any).SpeechRecognition()
      }
    }

    if (recognitionInstance) {
      setIsSupported(true)
      setRecognition(recognitionInstance)
      
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-US'
      recognitionInstance.maxAlternatives = 1

      recognitionInstance.onstart = () => {
        setIsListening(true)
        setError(null)
        setTranscript('')
      }

      recognitionInstance.onresult = (event: any) => {
        const result = event.results[0][0].transcript
        setTranscript(result)
      }

      recognitionInstance.onerror = (event: any) => {
        setError('Voice recognition failed')
        setIsListening(false)
        try {
          recognitionInstance.stop()
          recognitionInstance.abort()
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }
    } else {
      setIsSupported(false)
    }

    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop()
          recognitionInstance.abort()
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start()
      } catch (error) {
        setError('Failed to start voice recognition')
      }
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      try {
        recognition.stop()
      } catch (error) {
        // Ignore stop errors
      }
    }
  }

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    error
  }
}
