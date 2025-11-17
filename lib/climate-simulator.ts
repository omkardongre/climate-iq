// Real AI-Powered Climate Action Simulator using Gemini 2.5 Flash
import { geminiService } from './gemini-service'

export interface SimulationParameters {
  transport_reduction: number // 0-100%
  energy_efficiency: number   // 0-100%
  diet_change: number        // 0-100%
  waste_reduction: number    // 0-100%
  community_size: number     // 1-1000 people
  time_horizon: string       // "1_week" | "1_month" | "1_year" | "5_years" | "10_years"
  location?: string          // User location for regional data
  current_lifestyle?: string // "urban" | "suburban" | "rural"
}

export interface SimulationResult {
  personal_impact: {
    co2_saved: number
    cost_savings: number
    health_benefits: number
  }
  community_impact: {
    total_co2_saved: number
    economic_impact: number
    environmental_score: number
  }
  timeline_data: Array<{
    period: string
    personal_co2: number
    community_co2: number
    cumulative_savings: number
  }>
  breakdown_data: Array<{
    category: string
    impact: number
    color: string
  }>
  insights: {
    biggest_impact: string
    community_power: string
    scaled_context: string
    recommendations: string[]
  }
  confidence_score: number
}

class ClimateSimulator {
  async runSimulation(params: SimulationParameters): Promise<SimulationResult> {
    try {
      console.log('ClimateSimulator: Making server-side API call with params:', params)
      
      // Use server-side API route instead of direct client call
      const response = await fetch('/api/climate-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`)
      }
      
      const simulationData = await response.json()
      console.log('ClimateSimulator: Received response:', simulationData)
      
      return simulationData
    } catch (error) {
      console.error('AI simulation failed:', error)
      // Fall back to mathematical simulation
      return this.generateFallbackSimulation(params)
    }
  }

  private buildSimulationPrompt(params: SimulationParameters): string {
    const timeHorizonText = {
      "1_week": "1 week",
      "1_month": "1 month", 
      "1_year": "1 year",
      "5_years": "5 years",
      "10_years": "10 years"
    }[params.time_horizon] || "1 year"

    return `You are a climate science expert analyzing environmental impact for rural and regional areas. Focus on rural conditions and challenges.

RURAL SCENARIO ANALYSIS:
- Transport reduction: ${params.transport_reduction}% (less driving long distances, solar-powered transport)
- Energy efficiency: ${params.energy_efficiency}% (solar panels, off-grid systems, efficient cooling)
- Diet changes: ${params.diet_change}% (local produce, reduced meat from drought-affected areas)
- Waste reduction: ${params.waste_reduction}% (composting, reduced packaging in remote areas)
- Community size: ${params.community_size} people in outback/rural community
- Time horizon: ${timeHorizonText}
- Location: ${params.location || "Rural region"}
- Lifestyle: ${params.current_lifestyle || "Rural"}

REQUIRED ANALYSIS FOR RURAL AREAS:
1. Calculate CO2 savings considering long transport distances and remote infrastructure
2. Estimate cost savings including fuel costs for remote areas and solar energy benefits
3. Assess health benefits (reduced dust exposure, exercise in extreme heat, local food access)
4. Scale impact for rural community of ${params.community_size} people
5. Project timeline showing cumulative impact over ${timeHorizonText}
6. Identify which action has biggest impact in rural conditions
7. Explain community multiplier effects in remote rural communities
8. Provide regional context (equivalent to removing vehicles, solar installations)
9. Give 3 specific recommendations for maximizing rural environmental impact

Use regional climate data and rural-specific conditions. Consider wildfire risks, drought, and isolation.

Respond in JSON format:
{
  "personal_co2_saved_per_year": number,
  "transport_savings_kg": number,
  "energy_savings_kg": number,
  "diet_savings_kg": number,
  "waste_savings_kg": number,
  "annual_cost_savings": number,
  "health_score": number,
  "community_multiplier": number,
  "biggest_impact_category": string,
  "community_power_explanation": string,
  "scaled_context": string,
  "recommendations": [string, string, string],
  "confidence_level": number
}`
  }

  private async parseAIResponse(aiContent: string, params: SimulationParameters): Promise<SimulationResult> {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in AI response')
      
      const aiData = JSON.parse(jsonMatch[0])
      
      // Convert time horizon to multiplier
      const timeMultiplier = this.getTimeMultiplier(params.time_horizon)
      
      // Generate timeline data
      const timelineData = this.generateTimelineData(aiData, params, timeMultiplier)
      
      // Generate breakdown data
      const breakdownData = [
        { category: "Transport", impact: aiData.transport_savings_kg * timeMultiplier, color: "#ef4444" },
        { category: "Energy", impact: aiData.energy_savings_kg * timeMultiplier, color: "#f97316" },
        { category: "Diet", impact: aiData.diet_savings_kg * timeMultiplier, color: "#eab308" },
        { category: "Waste", impact: aiData.waste_savings_kg * timeMultiplier, color: "#22c55e" },
      ]

      const totalPersonalSavings = aiData.personal_co2_saved_per_year * timeMultiplier
      const totalCommunitySavings = totalPersonalSavings * params.community_size * (aiData.community_multiplier || 1)

      return {
        personal_impact: {
          co2_saved: totalPersonalSavings,
          cost_savings: aiData.annual_cost_savings * timeMultiplier,
          health_benefits: aiData.health_score || 75
        },
        community_impact: {
          total_co2_saved: totalCommunitySavings,
          economic_impact: aiData.annual_cost_savings * timeMultiplier * params.community_size,
          environmental_score: Math.min(100, (totalCommunitySavings / 1000) * 10) // Scale to 0-100
        },
        timeline_data: timelineData,
        breakdown_data: breakdownData,
        insights: {
          biggest_impact: aiData.biggest_impact_category || "Transport",
          community_power: aiData.community_power_explanation || "Community actions amplify individual impact",
          scaled_context: aiData.scaled_context || "Equivalent to removing cars from the road",
          recommendations: aiData.recommendations || ["Increase public transport use", "Switch to renewable energy", "Adopt plant-based meals"]
        },
        confidence_score: aiData.confidence_level || 85
      }
    } catch (error) {
      console.error('Error parsing AI response:', error)
      return this.generateFallbackSimulation(params)
    }
  }

  private generateFallbackSimulation(params: SimulationParameters): SimulationResult {
    // Enhanced fallback with more realistic calculations
    const timeMultiplier = this.getTimeMultiplier(params.time_horizon)
    
    // More realistic baseline calculations (kg CO2 per year)
    const avgPersonalCO2 = 16000 // Global average per person
    const transportSavings = (params.transport_reduction / 100) * 4800 // Transport is ~30% of personal emissions
    const energySavings = (params.energy_efficiency / 100) * 3200   // Energy is ~20% of personal emissions
    const dietSavings = (params.diet_change / 100) * 2400          // Diet is ~15% of personal emissions
    const wasteSavings = (params.waste_reduction / 100) * 800      // Waste is ~5% of personal emissions

    const totalPersonalSavings = transportSavings + energySavings + dietSavings + wasteSavings
    const communityMultiplier = Math.min(1.5, 1 + (params.community_size / 1000)) // Community effects
    const totalCommunitySavings = totalPersonalSavings * params.community_size * communityMultiplier

    const timelineData = this.generateRealisticTimeline(totalPersonalSavings, params.community_size, timeMultiplier)
    
    const breakdownData = [
      { category: "Transport", impact: transportSavings * timeMultiplier, color: "#ef4444" },
      { category: "Energy", impact: energySavings * timeMultiplier, color: "#f97316" },
      { category: "Diet", impact: dietSavings * timeMultiplier, color: "#eab308" },
      { category: "Waste", impact: wasteSavings * timeMultiplier, color: "#22c55e" },
    ]

    return {
      personal_impact: {
        co2_saved: totalPersonalSavings * timeMultiplier,
        cost_savings: totalPersonalSavings * 0.08 * timeMultiplier, // $0.08 per kg CO2 saved
        health_benefits: Math.min(95, ((transportSavings + dietSavings) / avgPersonalCO2) * 100)
      },
      community_impact: {
        total_co2_saved: totalCommunitySavings * timeMultiplier,
        economic_impact: totalCommunitySavings * 0.08 * timeMultiplier,
        environmental_score: Math.min(100, (totalCommunitySavings / (avgPersonalCO2 * params.community_size)) * 100)
      },
      timeline_data: timelineData,
      breakdown_data: breakdownData,
      insights: {
        biggest_impact: this.getBiggestImpactCategory(breakdownData),
        community_power: `With ${params.community_size} people, your collective impact is ${communityMultiplier.toFixed(1)}x stronger than individual actions alone.`,
        scaled_context: this.getScaledContext(totalCommunitySavings * timeMultiplier),
        recommendations: this.getRecommendations(params)
      },
      confidence_score: 78 // Lower confidence for fallback
    }
  }

  private getTimeMultiplier(timeHorizon: string): number {
    const multipliers = {
      "1_week": 1 / 52,
      "1_month": 1 / 12,
      "1_year": 1,
      "5_years": 5,
      "10_years": 10
    }
    return multipliers[timeHorizon as keyof typeof multipliers] || 1
  }

  private generateTimelineData(aiData: any, params: SimulationParameters, timeMultiplier: number) {
    const periods = this.getTimelinePeriods(params.time_horizon)
    const personalAnnual = aiData.personal_co2_saved_per_year || 3000
    const communityAnnual = personalAnnual * params.community_size
    
    return periods.map((period, index) => {
      const progress = (index + 1) / periods.length
      return {
        period,
        personal_co2: personalAnnual * progress * timeMultiplier,
        community_co2: communityAnnual * progress * timeMultiplier,
        cumulative_savings: communityAnnual * progress * timeMultiplier
      }
    })
  }

  private generateRealisticTimeline(personalSavings: number, communitySize: number, timeMultiplier: number) {
    const periods = ["Month 1", "Month 3", "Month 6", "Month 9", "Year 1"]
    const communityAnnual = personalSavings * communitySize
    
    return periods.map((period, index) => {
      const progress = (index + 1) / 12 // Monthly progress
      return {
        period,
        personal_co2: personalSavings * progress * timeMultiplier,
        community_co2: communityAnnual * progress * timeMultiplier,
        cumulative_savings: communityAnnual * progress * timeMultiplier
      }
    })
  }

  private getTimelinePeriods(timeHorizon: string): string[] {
    const periods = {
      "1_week": ["Day 1", "Day 3", "Day 5", "Day 7"],
      "1_month": ["Week 1", "Week 2", "Week 3", "Week 4"],
      "1_year": ["Month 3", "Month 6", "Month 9", "Month 12"],
      "5_years": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
      "10_years": ["Year 2", "Year 4", "Year 6", "Year 8", "Year 10"]
    }
    return periods[timeHorizon as keyof typeof periods] || periods["1_year"]
  }

  private getBiggestImpactCategory(breakdownData: Array<{category: string, impact: number}>): string {
    return breakdownData.reduce((max, current) => 
      current.impact > max.impact ? current : max
    ).category
  }

  private getScaledContext(totalCO2Saved: number): string {
    const carsOffRoad = Math.round(totalCO2Saved / 4600) // Average car emits 4.6 tons CO2/year
    const treesPlanted = Math.round(totalCO2Saved / 22) // One tree absorbs ~22kg CO2/year
    
    if (carsOffRoad >= 1) {
      return `Equivalent to removing ${carsOffRoad} car${carsOffRoad > 1 ? 's' : ''} from the road for a year`
    } else {
      return `Equivalent to planting ${treesPlanted} trees`
    }
  }

  private getRecommendations(params: SimulationParameters): string[] {
    const recommendations = []
    
    if (params.transport_reduction < 50) {
      recommendations.push("Increase public transport or cycling to maximize transport impact")
    }
    if (params.energy_efficiency < 70) {
      recommendations.push("Switch to LED lights and renewable energy for bigger energy savings")
    }
    if (params.diet_change < 40) {
      recommendations.push("Try 2-3 plant-based meals per week to reduce food emissions")
    }
    
    // Fill remaining slots with general advice
    const generalAdvice = [
      "Engage neighbors to multiply your community impact",
      "Track progress monthly to maintain motivation",
      "Share successes on social media to inspire others"
    ]
    
    while (recommendations.length < 3) {
      recommendations.push(generalAdvice[recommendations.length] || "Continue your climate actions consistently")
    }
    
    return recommendations.slice(0, 3)
  }
}

export const climateSimulator = new ClimateSimulator()
