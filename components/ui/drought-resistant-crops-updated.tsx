'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Droplets, Thermometer, Calendar, MapPin, Lightbulb } from 'lucide-react'
import DynamicResourceSection from '@/components/DynamicResourceSection'

interface CropRecommendation {
  name: string
  variety: string
  waterRequirement: string
  growthPeriod: string
  yieldPotential: string
  droughtTolerance: 'High' | 'Medium' | 'Low'
  soilType: string[]
  plantingWindow: string
  tips: string[]
}

const cropDatabase: CropRecommendation[] = [
  {
    name: 'Sorghum',
    variety: 'CSH-16',
    waterRequirement: '450-650mm',
    growthPeriod: '110-120 days',
    yieldPotential: '3-4 tons/hectare',
    droughtTolerance: 'High',
    soilType: ['Sandy loam', 'Clay loam', 'Black cotton'],
    plantingWindow: 'June-July (Kharif)',
    tips: [
      'Plant immediately after first good rainfall',
      'Maintain 45cm row spacing',
      'Apply organic mulch to retain moisture'
    ]
  },
  {
    name: 'Pearl Millet',
    variety: 'HHB-67 Improved',
    waterRequirement: '350-500mm',
    growthPeriod: '75-90 days',
    yieldPotential: '2-3 tons/hectare',
    droughtTolerance: 'High',
    soilType: ['Sandy', 'Sandy loam', 'Light clay'],
    plantingWindow: 'June-August',
    tips: [
      'Excellent for arid regions',
      'Can withstand high temperatures',
      'Harvest before full maturity in drought conditions'
    ]
  },
  {
    name: 'Finger Millet',
    variety: 'GPU-28',
    waterRequirement: '500-750mm',
    growthPeriod: '120-150 days',
    yieldPotential: '2.5-3.5 tons/hectare',
    droughtTolerance: 'Medium',
    soilType: ['Red soil', 'Sandy loam', 'Hill slopes'],
    plantingWindow: 'May-July',
    tips: [
      'Suitable for marginal lands',
      'Rich in calcium and iron',
      'Store well for long periods'
    ]
  }
]

export default function DroughtResistantCropsUpdated() {
  const [location, setLocation] = useState('')
  const [soilType, setSoilType] = useState('')
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeCrops = async () => {
    setIsAnalyzing(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Filter crops based on soil type if provided
    let filteredCrops = cropDatabase
    if (soilType) {
      filteredCrops = cropDatabase.filter(crop => 
        crop.soilType.some(soil => 
          soil.toLowerCase().includes(soilType.toLowerCase())
        )
      )
    }
    
    setRecommendations(filteredCrops)
    setIsAnalyzing(false)
  }

  const getDroughtToleranceColor = (tolerance: string) => {
    switch (tolerance) {
      case 'High': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // Static fallback content for when Storyblok is not available
  const fallbackResourceContent = (
    <Card className="bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-700 dark:text-gray-300">
          Drought-Resistant Crops Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Government Support</h4>
            <ul className="space-y-1">
              <li>• Crop insurance schemes</li>
              <li>• Drought relief programs</li>
              <li>• Seed subsidy programs</li>
              <li>• Agricultural extension services</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Research & Extension</h4>
            <ul className="space-y-1">
              <li>• GRDC variety guides</li>
              <li>• State agriculture departments</li>
              <li>• CSIRO drought research</li>
              <li>• Local agronomist networks</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Drought-Resistant Crop Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter your location (e.g., Maharashtra, India)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="soilType">Soil Type (Optional)</Label>
              <Input
                id="soilType"
                placeholder="e.g., Sandy loam, Clay, Red soil"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={analyzeCrops}
            disabled={isAnalyzing || !location}
            className="w-full"
          >
            {isAnalyzing ? 'Analyzing...' : 'Get Crop Recommendations'}
          </Button>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recommended Drought-Resistant Crops</h3>
          {recommendations.map((crop, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{crop.name}</CardTitle>
                  <Badge className={getDroughtToleranceColor(crop.droughtTolerance)}>
                    {crop.droughtTolerance} Drought Tolerance
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Variety: {crop.variety}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Water Requirement</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{crop.waterRequirement}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Growth Period</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{crop.growthPeriod}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Yield Potential</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{crop.yieldPotential}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Suitable Soil Types
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {crop.soilType.map((soil, soilIndex) => (
                      <Badge key={soilIndex} variant="outline">
                        {soil}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Planting Window: {crop.plantingWindow}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Growing Tips
                  </p>
                  <ul className="text-sm space-y-1">
                    {crop.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dynamic Resource Section - This will load from Storyblok CMS */}
      <DynamicResourceSection 
        featureName="drought_crops"
        fallbackContent={fallbackResourceContent}
      />
    </div>
  )
}
