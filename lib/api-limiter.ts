// API Rate Limiter for Hackathon - Prevents exceeding free tier limits

interface RateLimitConfig {
  maxCallsPerHour: number
  service: string
}

interface CallRecord {
  timestamp: number
  count: number
}

class APIRateLimiter {
  private callHistory: Map<string, CallRecord[]> = new Map()

  constructor(private configs: Map<string, RateLimitConfig>) {}

  canMakeCall(service: string): boolean {
    const config = this.configs.get(service)
    if (!config) return true

    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    
    // Get or create call history for this service
    const history = this.callHistory.get(service) || []
    
    // Remove calls older than 1 hour
    const recentCalls = history.filter(record => record.timestamp > oneHourAgo)
    
    // Count total calls in the last hour
    const totalCalls = recentCalls.reduce((sum, record) => sum + record.count, 0)
    
    return totalCalls < config.maxCallsPerHour
  }

  recordCall(service: string): void {
    const now = Date.now()
    const history = this.callHistory.get(service) || []
    
    // Add new call record
    history.push({ timestamp: now, count: 1 })
    
    // Keep only last hour of records
    const oneHourAgo = now - 60 * 60 * 1000
    const recentHistory = history.filter(record => record.timestamp > oneHourAgo)
    
    this.callHistory.set(service, recentHistory)
  }

  getRemainingCalls(service: string): number {
    const config = this.configs.get(service)
    if (!config) return Infinity

    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    
    const history = this.callHistory.get(service) || []
    const recentCalls = history.filter(record => record.timestamp > oneHourAgo)
    const totalCalls = recentCalls.reduce((sum, record) => sum + record.count, 0)
    
    return Math.max(0, config.maxCallsPerHour - totalCalls)
  }

  getTimeUntilReset(service: string): number {
    const history = this.callHistory.get(service) || []
    if (history.length === 0) return 0

    const oldestCall = Math.min(...history.map(record => record.timestamp))
    const oneHourFromOldest = oldestCall + 60 * 60 * 1000
    
    return Math.max(0, oneHourFromOldest - Date.now())
  }
}

// Initialize rate limiter with competition-safe limits
const rateLimitConfigs = new Map<string, RateLimitConfig>([
  // Gemini removed - has generous 15 RPM free tier
  ['openweather', { 
    maxCallsPerHour: parseInt(process.env.MAX_OPENWEATHER_CALLS_PER_HOUR || '12'), 
    service: 'OpenWeather' 
  }]
])

export const apiLimiter = new APIRateLimiter(rateLimitConfigs)

// Helper function to check if API call is allowed
export function checkAPILimit(service: 'gemini' | 'openweather'): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  // Gemini has no artificial limits - generous 15 RPM free tier
  if (service === 'gemini') {
    return { allowed: true, remaining: 999, resetTime: 0 }
  }
  
  const allowed = apiLimiter.canMakeCall(service)
  const remaining = apiLimiter.getRemainingCalls(service)
  const resetTime = apiLimiter.getTimeUntilReset(service)

  return { allowed, remaining, resetTime }
}

// Helper function to record API usage
export function recordAPICall(service: 'gemini' | 'openweather'): void {
  // Don't record Gemini calls - no artificial limits
  if (service !== 'gemini') {
    apiLimiter.recordCall(service)
  }
}

// Error messages for rate limiting
export const RATE_LIMIT_MESSAGES = {
  gemini: "AI service temporarily limited to preserve free tier. Please try again in a few minutes.",
  openweather: "Weather data temporarily limited to preserve free tier. Please try again in a few minutes."
}
