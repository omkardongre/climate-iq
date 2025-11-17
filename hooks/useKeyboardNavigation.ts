'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useKeyboardNavigation() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return
      }

      // Alt + Number shortcuts for navigation
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            router.push('/#climate-map')
            break
          case '2':
            event.preventDefault()
            router.push('/#agriculture')
            break
          case '3':
            event.preventDefault()
            router.push('/#urban')
            break
          case '4':
            event.preventDefault()
            router.push('/community')
            break
          case '5':
            event.preventDefault()
            router.push('/chat')
            break
          case 'h':
          case 'H':
            event.preventDefault()
            router.push('/')
            break
        }
      }

      // Ctrl + / for voice navigation toggle
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault()
        // Trigger voice navigation button click
        const voiceButton = document.querySelector('[data-voice-nav-button]') as HTMLButtonElement
        if (voiceButton) {
          voiceButton.click()
        }
      }

      // Escape key to close modals/dialogs
      if (event.key === 'Escape') {
        // Let the default behavior handle this for dialogs
        return
      }

      // Tab navigation enhancement - ensure focus is visible
      if (event.key === 'Tab') {
        // Add a class to body to show focus indicators when using keyboard
        document.body.classList.add('keyboard-navigation')
        
        // Remove the class after a short delay if mouse is used
        const removeKeyboardClass = () => {
          document.body.classList.remove('keyboard-navigation')
          document.removeEventListener('mousedown', removeKeyboardClass)
        }
        
        setTimeout(() => {
          document.addEventListener('mousedown', removeKeyboardClass)
        }, 100)
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [router])

  // Function to programmatically focus on main content
  const focusMainContent = () => {
    const mainContent = document.querySelector('main, [role="main"], #main-content')
    if (mainContent instanceof HTMLElement) {
      mainContent.focus()
    }
  }

  // Function to skip to main content
  const skipToContent = () => {
    const mainContent = document.querySelector('main, [role="main"], #main-content, .container')
    if (mainContent instanceof HTMLElement) {
      mainContent.scrollIntoView({ behavior: 'smooth' })
      mainContent.focus()
    }
  }

  const getKeyboardShortcuts = () => [
    { keys: "Alt + 1", action: "Go to Climate Map", route: "/#climate-map" },
    { keys: "Alt + 2", action: "Go to Agriculture Hub", route: "/#agriculture" },
    { keys: "Alt + 3", action: "Go to Urban Hub", route: "/#urban" },
    { keys: "Alt + 4", action: "Go to Community", route: "/community" },
    { keys: "Alt + 5", action: "Go to AI Advisor", route: "/chat" },
    { keys: "Alt + H", action: "Go to Home", route: "/" },
    { keys: "Ctrl + /", action: "Toggle Voice Navigation", route: null },
    { keys: "Tab", action: "Navigate between elements", route: null },
    { keys: "Enter/Space", action: "Activate focused element", route: null },
  ]

  return {
    focusMainContent,
    skipToContent,
    getKeyboardShortcuts
  }
}
