'use client'

import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

export function SkipToContent() {
  const { skipToContent } = useKeyboardNavigation()

  return (
    <a
      href="#main-content"
      className="skip-to-content"
      onClick={(e) => {
        e.preventDefault()
        skipToContent()
      }}
    >
      Skip to main content
    </a>
  )
}
