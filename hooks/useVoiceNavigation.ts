'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface VoiceCommand {
  keywords: string[]
  route: string
  description: string
}

const routeCommands: VoiceCommand[] = [
  { keywords: ['home', 'main'], route: '/', description: 'home' },
  { keywords: ['map', 'climate map', 'interactive map'], route: '/#climate-map', description: 'interactive climate map' },
  { keywords: ['agriculture', 'smart agriculture', 'farming'], route: '/#agriculture', description: 'smart agriculture hub' },
  { keywords: ['urban', 'sustainability', 'city'], route: '/#urban', description: 'urban sustainability hub' },
  { keywords: ['community', 'community hub', 'hub'], route: '/community', description: 'community hub' },
  { keywords: ['chat', 'mentor', 'ai', 'advisor'], route: '/chat', description: 'AI climate advisor' }
]

export function useVoiceNavigation() {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Initialize recognition
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
        console.log('Voice recognition started')
        setIsListening(true)
        setError(null)
      }

      recognitionInstance.onresult = (event: any) => {
        const result = event.results[0][0].transcript.toLowerCase()
        console.log('Voice result:', result)
        setTranscript(result)
        
        // Process the command immediately since interimResults is false
        processVoiceCommand(result)
      }

      recognitionInstance.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error)
        let errorMessage = 'Voice recognition failed'
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.'
            break
          case 'audio-capture':
            errorMessage = 'Microphone not available. Please check permissions.'
            break
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.'
            break
          case 'network':
            errorMessage = 'Network error. Please check your connection.'
            break
          default:
            errorMessage = `Voice recognition error: ${event.error}`
        }
        
        setError(errorMessage)
        setIsListening(false)
        
        // Force stop recognition on error
        try {
          recognitionInstance.stop()
          recognitionInstance.abort()
        } catch (error) {
          console.log('Error stopping recognition after error:', error)
        }
        
        // Provide audio feedback for error
        if ('speechSynthesis' in window) {
          try {
            speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance('Voice recognition failed')
            utterance.rate = 0.9
            utterance.volume = 0.8
            speechSynthesis.speak(utterance)
          } catch (error) {
            console.log('Speech synthesis error:', error)
          }
        }
      }

      recognitionInstance.onend = () => {
        console.log('Voice recognition ended')
        setIsListening(false)
      }
    } else {
      setIsSupported(false)
      console.warn('Speech recognition not supported')
    }

    // Cleanup function to ensure recognition is stopped when component unmounts
    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop()
          recognitionInstance.abort()
        } catch (error) {
          console.log('Error cleaning up recognition:', error)
        }
      }
    }
  }, [])

  const processVoiceCommand = useCallback((command: string) => {
    console.log('Processing voice command:', command)
    const words = command.toLowerCase().split(' ')
    
    for (const routeCommand of routeCommands) {
      for (const keyword of routeCommand.keywords) {
        if (words.includes(keyword) || command.includes(keyword)) {
          console.log('Command matched:', keyword, 'for route:', routeCommand.route)
          
          // Stop listening immediately when command is recognized
          if (recognition && isListening) {
            try {
              recognition.stop()
              recognition.abort()
            } catch (error) {
              console.log('Error stopping recognition:', error)
            }
          }
          
          // Clear states
          setIsListening(false)
          setTranscript('')
          
          // Provide voice feedback
          if ('speechSynthesis' in window) {
            try {
              speechSynthesis.cancel()
              const utterance = new SpeechSynthesisUtterance(`Navigating to ${routeCommand.description.toLowerCase()}`)
              utterance.rate = 0.9
              utterance.volume = 0.8
              speechSynthesis.speak(utterance)
            } catch (error) {
              console.log('Speech synthesis error:', error)
            }
          }
          
          // Navigate to route
          setTimeout(() => {
            router.push(routeCommand.route)
          }, 1000)
          
          // Force cleanup after navigation
          setTimeout(() => {
            if (recognition) {
              try {
                recognition.stop()
                recognition.abort()
              } catch (error) {
                console.log('Error in final cleanup:', error)
              }
            }
            setIsListening(false)
            setTranscript('')
          }, 1200)
          return
        }
      }
    }

    // No command found
    console.log('No command matched for:', command)
    setError(`Command "${command}" not recognized. Try: ${routeCommands.map(cmd => cmd.keywords[0]).join(', ')}`)
    
    // Stop listening after failed command
    if (recognition && isListening) {
      try {
        recognition.stop()
        recognition.abort()
      } catch (error) {
        console.log('Error stopping recognition:', error)
      }
    }
    setIsListening(false)
    
    if ('speechSynthesis' in window) {
      try {
        speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance('Command not recognized. Please try again.')
        utterance.rate = 0.9
        utterance.volume = 0.8
        speechSynthesis.speak(utterance)
      } catch (error) {
        console.log('Speech synthesis error:', error)
      }
    }
  }, [router, recognition, isListening])

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript('')
      setError(null)
      
      // Provide immediate audio feedback when user clicks
      if ('speechSynthesis' in window) {
        try {
          speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance('Listening')
          utterance.rate = 1.0
          utterance.volume = 0.8
          speechSynthesis.speak(utterance)
        } catch (error) {
          console.log('Speech synthesis error:', error)
        }
      }
      
      // Start recognition after a short delay to let "Listening" play
      setTimeout(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
              console.log('Microphone access granted, starting recognition')
              try {
                recognition.start()
              } catch (error) {
                console.error('Error starting recognition:', error)
                setError('Failed to start voice recognition. Please try again.')
                setIsListening(false)
              }
            })
            .catch((error) => {
              console.error('Microphone access denied:', error)
              setError('Microphone access required for voice navigation. Please allow microphone access and try again.')
              setIsListening(false)
            })
        } else {
          console.log('Starting recognition without explicit permission check')
          try {
            recognition.start()
          } catch (error) {
            console.error('Error starting recognition:', error)
            setError('Failed to start voice recognition. Please try again.')
            setIsListening(false)
          }
        }
      }, 1000) // Wait 1 second for "Listening" to finish
    }
  }, [recognition, isListening])

  const stopListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.stop()
        recognition.abort() // Force stop
      } catch (error) {
        console.log('Error stopping recognition:', error)
      }
      setIsListening(false)
      setTranscript('')
      setError(null)
      
      // Cancel any ongoing speech
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
      }
    }
  }, [recognition])

  const getAvailableCommands = useCallback(() => {
    return routeCommands.map(cmd => ({
      keywords: cmd.keywords,
      description: cmd.description
    }))
  }, [])

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    getAvailableCommands
  }
}
