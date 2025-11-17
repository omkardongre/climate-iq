'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, MicOff, Volume2, HelpCircle, X } from 'lucide-react'
import { useVoiceNavigation } from '@/hooks/useVoiceNavigation'

interface VoiceNavigationProps {
  className?: string
}

export function VoiceNavigation({ className }: VoiceNavigationProps) {
  const [showHelp, setShowHelp] = useState(false)
  const {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    getAvailableCommands
  } = useVoiceNavigation()

  if (!isSupported) {
    return (
      <div className={className}>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Voice navigation not supported in this browser
        </Badge>
      </div>
    )
  }

  const commands = getAvailableCommands()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Voice Control Button */}
      <div className="flex items-center space-x-2">
        <Button
          onClick={isListening ? stopListening : startListening}
          variant={isListening ? "destructive" : "default"}
          size="sm"
          className={isListening ? "animate-pulse" : ""}
          data-voice-nav-button
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4 mr-2" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Voice Navigate
            </>
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHelp(!showHelp)}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        {isListening && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse">
            <Volume2 className="h-3 w-3 mr-1" />
            Listening...
          </Badge>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Heard:</strong> "{transcript}"
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <Card className="mt-4 max-h-64 overflow-y-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-base font-semibold flex items-center gap-2 mb-1">
                  <Volume2 className="h-4 w-4" />
                  Voice Commands
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Click "Voice Navigate" and say one of these commands
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(false)}
                className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {commands.map((command, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                  <div>
                    <p className="font-medium text-sm capitalize">{command.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Say: {command.keywords.map(k => `"${k}"`).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> Speak clearly after hearing "Listening". 
                The system will confirm navigation with voice feedback.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
