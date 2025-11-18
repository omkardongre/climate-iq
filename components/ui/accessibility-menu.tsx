"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accessibility, X, Keyboard, Volume2, Contrast } from "lucide-react";
import { VoiceNavigation } from "./voice-navigation";
import { ThemeToggle } from "./theme-toggle";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

interface AccessibilityMenuProps {
  className?: string;
}

export function AccessibilityMenu({ className }: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { getKeyboardShortcuts } = useKeyboardNavigation();
  
  const keyboardShortcuts = getKeyboardShortcuts();

  return (
    <div className={className}>
      {/* Floating Accessibility Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full w-14 h-14 shadow-lg bg-green-600 hover:bg-green-700 text-white"
        title="Open Accessibility Menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Accessibility className="h-6 w-6" />
        )}
      </Button>

      {/* Accessibility Panel */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto shadow-xl border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Accessibility className="h-5 w-5 text-green-600" />
              Accessibility Options
            </CardTitle>
            <CardDescription>
              Make OutbackVision AI work better for you
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Theme Controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Contrast className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-sm">Visual Theme</h4>
              </div>
              <ThemeToggle showLabel className="w-full justify-start" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Switch between light, dark, and high contrast modes
              </p>
            </div>

            {/* Voice Navigation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-sm">Voice Navigation</h4>
              </div>
              <VoiceNavigation />
            </div>

            {/* Keyboard Shortcuts */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-xs"
                  >
                    <Badge variant="outline" className="font-mono text-xs">
                      {shortcut.keys}
                    </Badge>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {shortcut.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessibility Info */}
            {/* <div className="p-3 bg-green-50 dark:bg-green-950 rounded border">
              <p className="text-xs text-green-800 dark:text-green-200">
                <strong>Screen Reader Support:</strong> This app is optimized for NVDA, JAWS, and VoiceOver. 
                All interactive elements have proper labels and descriptions.
              </p>
            </div> */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
