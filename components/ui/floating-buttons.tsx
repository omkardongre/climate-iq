'use client'

import { useState, useRef, useEffect } from 'react'
import { AccessibilityMenu } from './accessibility-menu'
import { ContextAwareAssistant } from './context-aware-assistant'

interface FloatingButtonsProps {
  pageTitle: string
  pageContext: string
}

export function FloatingButtons({ pageTitle, pageContext }: FloatingButtonsProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize position to bottom-right
  useEffect(() => {
    const updatePosition = () => {
      setPosition({
        x: window.innerWidth - 120, // 120px from right edge
        y: window.innerHeight - 160  // 160px from bottom
      })
    }
    
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    
    // Constrain to viewport
    const maxX = window.innerWidth - 100
    const maxY = window.innerHeight - 140
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  return (
    <div 
      ref={containerRef}
      className={`fixed z-50 space-y-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* AI Assistant Button - Top */}
      <div className="mb-2">
        <ContextAwareAssistant 
          pageTitle={pageTitle}
          pageContext={pageContext}
        />
      </div>
      
      {/* Accessibility Button - Bottom */}
      <div>
        <AccessibilityMenu />
      </div>
      
      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
          Drag to reposition
        </div>
      )}
    </div>
  )
}
