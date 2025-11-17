'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'

interface TTSControlsProps {
  text: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
  showStatus?: boolean
  autoSpeak?: boolean
}

export function TTSControls({ 
  text, 
  className = '', 
  size = 'sm',
  showStatus = true,
  autoSpeak = false
}: TTSControlsProps) {
  const { speak, stop, pause, resume, isSpeaking, isPaused, isSupported } = useTextToSpeech()

  if (!isSupported) {
    return (
      <Badge variant="secondary" className="text-xs">
        <VolumeX className="h-3 w-3 mr-1" />
        TTS not supported
      </Badge>
    )
  }

  const handleSpeak = () => {
    if (!text.trim()) return
    speak(text, { rate: 0.9, volume: 0.8 })
  }

  const handleToggle = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume()
      } else {
        pause()
      }
    } else {
      handleSpeak()
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size={size}
        onClick={handleToggle}
        className="h-8 w-8 p-0"
        title={isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Play'}
      >
        {isSpeaking && !isPaused ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {isSpeaking && (
        <Button
          variant="ghost"
          size={size}
          onClick={stop}
          className="h-8 w-8 p-0"
          title="Stop"
        >
          <Square className="h-4 w-4" />
        </Button>
      )}

      {showStatus && isSpeaking && (
        <Badge 
          variant="secondary" 
          className={`text-xs ${isPaused ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800 animate-pulse'}`}
        >
          <Volume2 className="h-3 w-3 mr-1" />
          {isPaused ? 'Paused' : 'Speaking'}
        </Badge>
      )}
    </div>
  )
}
