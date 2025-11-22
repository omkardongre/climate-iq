import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { message, selectedCountry } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Get country-specific context for local slang and terminology
    const countryContext = selectedCountry ? `Respond using local terminology and expressions appropriate for ${selectedCountry}. ` : ''

    const prompt = `You are a helpful AI Climate Assistant. You help users with climate-related questions, sustainability tips, and environmental guidance. 

${countryContext}

IMPORTANT FORMATTING RULES:
- Use proper markdown formatting with **bold** for emphasis
- Use ## for main headings and ### for subheadings
- Use bullet points with - for lists
- Add relevant emojis to make responses more engaging
- Structure your response with clear sections
- Keep paragraphs concise and well-organized
- Use local terminology and expressions when appropriate for ${selectedCountry || 'the user\'s region'}

User question: ${message}
User location: ${selectedCountry || 'Global'}

Provide a helpful, informative response about climate and environmental topics. Keep it conversational and practical. Use proper formatting with headings, bold text, bullet points, and emojis to make it visually appealing and easy to read.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text.trim() })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { response: 'I apologize, but I encountered an error while processing your message. Please try again in a moment.' },
      { status: 200 }
    )
  }
}
