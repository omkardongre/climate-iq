'use client'

import React from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    // Split by lines to handle different markdown elements
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let currentList: string[] = []
    let listKey = 0

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-3 ml-4">
            {currentList.map((item, index) => (
              <li key={index} className="text-sm leading-relaxed">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        )
        currentList = []
      }
    }

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      if (!trimmedLine) {
        flushList()
        elements.push(<div key={`space-${index}`} className="h-3" />)
        return
      }

      // Handle headings with #
      if (trimmedLine.startsWith('# ')) {
        flushList()
        const text = trimmedLine.substring(2)
        elements.push(
          <h1 key={`h1-${index}`} className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">
            {renderInlineMarkdown(text)}
          </h1>
        )
      } else if (trimmedLine.startsWith('## ')) {
        flushList()
        const text = trimmedLine.substring(3)
        elements.push(
          <h2 key={`h2-${index}`} className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">
            {renderInlineMarkdown(text)}
          </h2>
        )
      } else if (trimmedLine.startsWith('### ')) {
        flushList()
        const text = trimmedLine.substring(4)
        elements.push(
          <h3 key={`h3-${index}`} className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-2">
            {renderInlineMarkdown(text)}
          </h3>
        )
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        // Handle bullet points
        const text = trimmedLine.substring(2)
        currentList.push(text)
      } else {
        // Handle regular paragraphs
        flushList()
        if (trimmedLine) {
          elements.push(
            <p key={`p-${index}`} className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
              {renderInlineMarkdown(trimmedLine)}
            </p>
          )
        }
      }
    })

    // Flush any remaining list items
    flushList()

    return elements
  }

  const renderInlineMarkdown = (text: string) => {
    // Handle bold text **text**
    let result: React.ReactNode[] = []
    let currentText = text
    let key = 0

    while (currentText.includes('**')) {
      const startIndex = currentText.indexOf('**')
      const endIndex = currentText.indexOf('**', startIndex + 2)
      
      if (endIndex === -1) break

      // Add text before bold
      if (startIndex > 0) {
        result.push(currentText.substring(0, startIndex))
      }

      // Add bold text
      const boldText = currentText.substring(startIndex + 2, endIndex)
      result.push(
        <strong key={`bold-${key++}`} className="font-semibold text-gray-900 dark:text-white">
          {boldText}
        </strong>
      )

      // Continue with remaining text
      currentText = currentText.substring(endIndex + 2)
    }

    // Add any remaining text
    if (currentText) {
      result.push(currentText)
    }

    return result.length > 0 ? result : text
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {renderMarkdown(content)}
    </div>
  )
}
