'use client'

import { storyblokEditable } from '@storyblok/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Phone, Mail } from 'lucide-react'

interface ResourceItem {
  item_name: string
  description?: string
  website_url?: string
  contact_info?: string
}

interface ResourceCategory {
  category_title: string
  resource_items: ResourceItem[]
}

interface ResourceSectionProps {
  blok: {
    feature_name: string
    country: string
    section_1?: ResourceCategory[]
    section_2?: ResourceCategory[]
  }
}

export default function ResourceSection({ blok }: ResourceSectionProps) {

  const renderResourceCategory = (category: ResourceCategory) => (
    <div key={category.category_title} className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-sm font-medium">
          {category.category_title}
        </Badge>
      </div>
      <div className="space-y-3">
        {category.resource_items?.map((item, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500 bg-white dark:bg-gray-900">
            <CardContent className="p-4">
              <div className="space-y-2">
                <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                  {item.item_name}
                </h5>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {item.website_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 text-xs"
                    >
                      <a 
                        href={item.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit Website
                      </a>
                    </Button>
                  )}
                  {item.contact_info && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {item.contact_info.includes('@') ? (
                        <Mail className="h-3 w-3" />
                      ) : (
                        <Phone className="h-3 w-3" />
                      )}
                      {item.contact_info}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <Card 
      {...storyblokEditable(blok)}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800"
    >
      <CardHeader>
        <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
          <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
          {getResourceTitle(blok.feature_name)} Resources
          <div className="ml-auto">
            <Badge variant="outline" className="text-xs">
              {blok.country?.toUpperCase() || 'GLOBAL'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {blok.section_1?.[0] && renderResourceCategory(blok.section_1[0])}
          {blok.section_2?.[0] && renderResourceCategory(blok.section_2[0])}
        </div>
      </CardContent>
    </Card>
  )
}

function getResourceTitle(featureName: string): string {
  const titles: Record<string, string> = {
    'drought-crops': 'Drought-Resistant Crops',
    'water-conservation': 'Water Conservation Strategy',
    'solar-optimizer': 'Solar Panel Optimizer',
    'habitat-protection': 'Habitat Protection',
    'farm-equipment': 'Farm Equipment Efficiency Guide',
    'impact-scanner': 'Environmental Impact Scanner',
    'climate-advisor': 'Climate Advisor',
    'goal-tracking': 'Goal Tracking'
  }
  return titles[featureName] || 'Climate Resources'
}
