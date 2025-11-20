'use client'

import { useState } from 'react'
import { storyblokService } from '@/lib/storyblok-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function StoryblokTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testStoryblokConnection = async () => {
    setLoading(true)
    setTestResult('Testing Storyblok connection...')
    
    try {
      console.log('Starting Storyblok API test...')
      const result = await storyblokService.getResourceSection('usa', 'water-conservation')
      
      if (result) {
        setTestResult(`✅ Success! Retrieved data: ${JSON.stringify(result, null, 2)}`)
        console.log('Storyblok test successful:', result)
      } else {
        setTestResult('❌ No data returned from Storyblok API')
        console.log('Storyblok test: No data returned')
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Storyblok test failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Storyblok API Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testStoryblokConnection} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Testing...' : 'Test Storyblok API'}
        </Button>
        
        {testResult && (
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto max-h-96">
            {testResult}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
