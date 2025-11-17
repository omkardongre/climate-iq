// Climatiq API Integration for Real Carbon Footprint Data
// https://docs.climatiq.io/

interface ClimatiqEmissionFactor {
  id: string
  name: string
  category: string
  unit_type: string
  factor: number
  factor_unit: string
  data_source: string
}

interface ClimatiqCalculationRequest {
  emission_factor: {
    activity_id: string
    data_version?: string
  }
  parameters: {
    [key: string]: number | string
  }
}

interface ClimatiqCalculationResponse {
  co2e: number
  co2e_unit: string
  co2e_calculation_method: string
  emission_factor: {
    name: string
    category: string
    source: string
  }
}

class ClimatiqService {
  private apiKey: string
  private baseUrl = 'https://api.climatiq.io'

  constructor() {
    this.apiKey = process.env.CLIMATIQ_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Climatiq API key not found. Using fallback calculations.')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error('Climatiq API key not configured')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Climatiq API error:', error)
      throw new Error(`Climatiq API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  // Calculate using a specific activity ID
  private async calculateWithActivityId(activityId: string, weight: number): Promise<{
    co2e: number
    unit: string
    source: string
    method: string
  } | null> {
    try {
      const calculationRequest: ClimatiqCalculationRequest = {
        emission_factor: {
          activity_id: activityId,
          data_version: '^26',
        },
        parameters: {
          weight,
          weight_unit: 'kg',
        }
      }

      const result: ClimatiqCalculationResponse = await this.makeRequest(
        '/estimate',
        {
          method: 'POST',
          body: JSON.stringify(calculationRequest),
        }
      )

      console.log(`✅ Climatiq real data: ${result.co2e} ${result.co2e_unit} from ${result.emission_factor.source}`)

      return {
        co2e: result.co2e,
        unit: result.co2e_unit,
        source: `Climatiq - ${result.emission_factor.source}`,
        method: result.co2e_calculation_method,
      }
    } catch (error) {
      console.error(`Failed to calculate with activity ID ${activityId}:`, error)
      return null
    }
  }

  // Search for emission factors by category/product
  async searchEmissionFactors(query: string, category?: string): Promise<ClimatiqEmissionFactor[]> {
    try {
      const params = new URLSearchParams({
        query,
        data_version: '^26', // Use latest dynamic version
        results_per_page: '10',
      })
      
      if (category) {
        params.append('category', category)
      }

      const data = await this.makeRequest(`/search?${params}`)
      return data.results || []
    } catch (error) {
      console.error('Failed to search emission factors:', error)
      return []
    }
  }

  // Calculate carbon footprint for a specific product
  async calculateProductFootprint(productName: string, weight: number = 1): Promise<{
    co2e: number
    unit: string
    source: string
    method: string
  } | null> {
    try {
      // Direct mapping for common materials to specific activity IDs
      const directMappings: Record<string, string> = {
        'pet': 'plastics_rubber-type_pet_including_forming_primary_material_production',
        'plastic bottle': 'plastics_rubber-type_pet_including_forming_primary_material_production',
        'water bottle': 'plastics_rubber-type_pet_including_forming_primary_material_production',
        'plastic bag': 'plastics_rubber-type_ldpe_including_forming_primary_material_production',
      }
      
      // Check for direct mapping first
      let activityId: string | null = null
      for (const [key, id] of Object.entries(directMappings)) {
        if (productName.toLowerCase().includes(key)) {
          activityId = id
          console.log(`Direct mapping found for "${productName}" -> ${id}`)
          break
        }
      }
      
      // If direct mapping found, use it directly
      if (activityId) {
        return await this.calculateWithActivityId(activityId, weight)
      }
      
      // Otherwise, search for emission factors
      let factors = await this.searchEmissionFactors(productName)
      
      // If no results, try extracting key material words
      if (factors.length === 0) {
        const materialKeywords = ['plastic', 'cotton', 'metal', 'paper', 'glass', 'aluminum', 'steel']
        const foundMaterial = materialKeywords.find(m => productName.toLowerCase().includes(m))
        
        if (foundMaterial) {
          console.log(`No results for "${productName}", trying material: "${foundMaterial}"`)
          factors = await this.searchEmissionFactors(foundMaterial)
        }
      }
      
      if (factors.length === 0) {
        console.log(`No emission factors found for: ${productName}`)
        return null
      }

      // Use the first/best matching factor
      const factor = factors[0]
      console.log(`Using emission factor: ${factor.name} (${factor.id}), unit_type: ${factor.unit_type}`)
      
      // Determine parameters based on unit type
      let parameters: { [key: string]: number | string } = {}
      
      switch (factor.unit_type?.toLowerCase()) {
        case 'weight':
        case 'mass':
          parameters = { weight, weight_unit: 'kg' }
          break
        case 'money':
          // Skip money-based factors for product scanning
          console.log('Skipping money-based emission factor')
          return null
        case 'volume':
          parameters = { volume: weight, volume_unit: 'l' }
          break
        default:
          // Default to weight
          parameters = { weight, weight_unit: 'kg' }
      }
      
      const calculationRequest: ClimatiqCalculationRequest = {
        emission_factor: {
          activity_id: factor.id,
          data_version: '^26', // Use latest dynamic version
        },
        parameters
      }

      const result: ClimatiqCalculationResponse = await this.makeRequest(
        '/estimate',
        {
          method: 'POST',
          body: JSON.stringify(calculationRequest),
        }
      )

      return {
        co2e: result.co2e,
        unit: result.co2e_unit,
        source: result.emission_factor.source,
        method: result.co2e_calculation_method,
      }
    } catch (error) {
      console.error('Failed to calculate product footprint:', error)
      return null
    }
  }

  // Get emission factors for common product categories
  async getProductCategoryFactors(category: string): Promise<ClimatiqEmissionFactor[]> {
    const categoryMap: Record<string, string> = {
      'food': 'Food and Beverages',
      'clothing': 'Textiles',
      'electronics': 'Electronics',
      'transport': 'Transport',
      'energy': 'Energy',
      'plastic': 'Materials',
      'paper': 'Materials',
      'metal': 'Materials',
    }

    const climatiqCategory = categoryMap[category.toLowerCase()] || category
    return this.searchEmissionFactors('', climatiqCategory)
  }

  // Fallback calculation using industry averages when Climatiq fails
  getFallbackEmissionFactor(category: string, weight: number = 1): {
    co2e: number
    unit: string
    source: string
    method: string
  } {
    // Industry average emission factors (kg CO2e per kg)
    const fallbackFactors: Record<string, number> = {
      'food': 2.5,
      'meat': 15.0,
      'dairy': 3.2,
      'vegetables': 0.4,
      'fruits': 0.3,
      'grains': 1.1,
      'clothing': 8.0,
      'cotton': 5.9,
      'polyester': 9.5,
      'electronics': 300.0, // per device
      'smartphone': 70.0,
      'laptop': 300.0,
      'plastic': 1.8,
      'bottle': 0.1,
      'bag': 0.006,
      'paper': 0.9,
      'cardboard': 0.7,
      'metal': 2.3,
      'aluminum': 8.2,
      'steel': 1.9,
      'glass': 0.5,
      'transport': 0.2, // per km
      'default': 2.0,
    }

    const factor = fallbackFactors[category.toLowerCase()] || fallbackFactors['default']
    
    return {
      co2e: factor * weight,
      unit: 'kg CO2e',
      source: 'Industry Average Research',
      method: 'lifecycle_assessment',
    }
  }
}

export const climatiqService = new ClimatiqService()

// Helper function to get carbon footprint with fallback
export async function getProductCarbonFootprint(
  productName: string, 
  category: string, 
  weight: number = 1
): Promise<{
  co2e: number
  unit: string
  source: string
  method: string
}> {
  try {
    // Try Climatiq API first
    const climatiqResult = await climatiqService.calculateProductFootprint(productName, weight)
    
    if (climatiqResult) {
      return climatiqResult
    }
  } catch (error) {
    console.log('Climatiq API unavailable, using fallback:', error)
  }

  // Fallback to industry averages
  return climatiqService.getFallbackEmissionFactor(category, weight)
}
