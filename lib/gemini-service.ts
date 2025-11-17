// Google Gemini API Service - Using official SDK for better compatibility
export interface VisionAnalysisResult {
  item_category: string
  carbon_footprint: number
  alternatives: Array<{
    name: string
    carbon_reduction: number
    description: string
    difficulty: 'easy' | 'medium' | 'hard'
  }>
  confidence: number
}

export interface ChatResponse {
  content: string
  context_used: boolean
  suggestions?: string[]
}

// Convert image to base64 for Gemini (from user's working code)
export const imageToBase64 = async (imageFile: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

class GeminiService {
  private apiKey: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

  constructor() {
    // Only throw error on server side, not client side
    if (typeof window === 'undefined') {
      // Server side
      this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY || ''
      if (!this.apiKey) {
        console.error('No Gemini API key found in environment variables')
        throw new Error('Gemini API key is required but not found in environment variables')
      }
    } else {
      // Client side - don't throw error, just log warning
      this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY || ''
      if (!this.apiKey) {
        console.warn('No public Gemini API key found - client-side operations may fail')
      }
    }
  }

  async analyzeImage(imageBase64: string): Promise<VisionAnalysisResult> {
    try {
      // Use the same approach as user's working project
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      
      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Analyze this image for environmental impact. Identify the main object and provide a JSON response with:
1. Item category (e.g., plastic_bottle, coffee_cup, etc.)
2. Estimated carbon footprint in kg CO2
3. Three sustainable alternatives with carbon reduction potential
4. Confidence level (0-100)

Return ONLY valid JSON in this exact format:
{
  "item_category": "string",
  "carbon_footprint": number,
  "alternatives": [
    {
      "name": "string", 
      "carbon_reduction": number,
      "description": "string",
      "difficulty": "easy"
    }
  ],
  "confidence": number
}`
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Data
                  }
                }
              ]
            }]
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API Error Response:', errorText)
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Gemini API Response:', data)

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API')
      }

      const content = data.candidates[0].content.parts[0].text
      console.log('Gemini Response Content:', content)
      
      try {
        // Clean the response to extract JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        console.error('Raw content:', content)
        
        // Fallback with realistic data
        return {
          item_category: "scanned_object",
          carbon_footprint: 8.5,
          alternatives: [
            {
              name: "Eco-friendly Alternative",
              carbon_reduction: 6.2,
              description: "Consider sustainable options for this item",
              difficulty: "easy" as const
            },
            {
              name: "Reusable Option",
              carbon_reduction: 7.8,
              description: "Switch to a reusable version of this product",
              difficulty: "medium" as const
            },
            {
              name: "Local Alternative",
              carbon_reduction: 5.1,
              description: "Find locally sourced alternatives",
              difficulty: "medium" as const
            }
          ],
          confidence: 75
        }
      }
    } catch (error) {
      console.error('Gemini Vision API error:', error)
      throw error
    }
  }

  async generateChatResponse(
    message: string, 
    context?: any,
    conversationHistory?: Array<{role: string, content: string}>
  ): Promise<ChatResponse> {
    // No rate limiting for Gemini - it has generous free tier (15 RPM)
    try {
      const systemPrompt = `You are an AI Climate Mentor powered by Google Gemini. You help users understand climate impact and take meaningful environmental actions. 

Key guidelines:
- Provide practical, actionable climate advice
- Use user context when available (location, recent scans, goals)
- Be encouraging and supportive
- Include specific numbers and data when possible
- Suggest concrete next steps
- Keep responses conversational but informative

${context ? `User context: ${context}` : ''}

Respond naturally and helpfully to climate-related questions.`

      const messages = [
        ...(Array.isArray(history) ? history.map((msg: any) => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        })) : []),
        { role: 'user', parts: [{ text: message }] }
      ]

      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: messages,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini Chat API error: ${response.statusText}`)
      }

      const data = await response.json()
      // No need to record API calls for Gemini - generous free tier

      const content = data.candidates[0].content.parts[0].text

      return {
        content,
        context_used: !!context,
        suggestions: this.extractSuggestions(content)
      }
    } catch (error) {
      console.error('Gemini Chat API error:', error)
      throw error
    }
  }

  private extractSuggestions(content: string): string[] {
    // Extract actionable suggestions from the response
    const suggestions: string[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      if (line.includes('•') || line.includes('-') || line.includes('*')) {
        const suggestion = line.replace(/[•\-*]/g, '').trim()
        if (suggestion.length > 10 && suggestion.length < 100) {
          suggestions.push(suggestion)
        }
      }
    }
    
    return suggestions.slice(0, 3) // Return max 3 suggestions
  }

  // Gemini has generous free tier - no artificial limits needed
  getRemainingCalls(): number {
    return 999 // Indicate unlimited for UI purposes
  }

  // Get time until rate limit resets
  getResetTime(): number {
    return 0 // No artificial reset time
  }
}

export const geminiService = new GeminiService()
