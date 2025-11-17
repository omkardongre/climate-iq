// Utility functions to convert markdown formatting to HTML/React components
import React from 'react'

export function parseMarkdownToHtml(text: string): string {
  if (!text) return ''
  
  let html = text
  
  // Convert bold text (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')
  
  // Convert italic text (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.*?)_/g, '<em>$1</em>')
  
  // Convert headers (## text)
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">$1</h1>')
  
  // Convert line breaks
  html = html.replace(/\n/g, '<br>')
  
  // Convert bullet points (- item or * item)
  html = html.replace(/^[\-\*] (.*$)/gim, '<li class="ml-4 mb-1">• $1</li>')
  
  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li.*?<\/li>(?:\s*<br>\s*<li.*?<\/li>)*)/g, '<ul class="mb-3">$1</ul>')
  
  // Clean up extra br tags around lists
  html = html.replace(/<br>\s*<ul>/g, '<ul>')
  html = html.replace(/<\/ul>\s*<br>/g, '</ul>')
  
  return html
}

export function renderMarkdownText(text: string): React.ReactElement {
  const htmlContent = parseMarkdownToHtml(text)
  
  return React.createElement('div', {
    className: "prose prose-sm max-w-none dark:prose-invert",
    dangerouslySetInnerHTML: { __html: htmlContent }
  })
}

// For numbered lists
export function parseNumberedList(text: string): string[] {
  const lines = text.split('\n')
  const listItems: string[] = []
  
  lines.forEach(line => {
    const match = line.match(/^\d+\.\s*(.+)$/)
    if (match) {
      listItems.push(match[1])
    }
  })
  
  return listItems
}

// For extracting sections from AI responses
export function extractSections(text: string): { [key: string]: string } {
  const sections: { [key: string]: string } = {}
  const lines = text.split('\n')
  let currentSection = ''
  let currentContent: string[] = []
  
  lines.forEach(line => {
    const headerMatch = line.match(/^#{1,3}\s*(.+)$/)
    if (headerMatch) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim()
      }
      // Start new section
      currentSection = headerMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '_')
      currentContent = []
    } else if (currentSection) {
      currentContent.push(line)
    }
  })
  
  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim()
  }
  
  return sections
}
