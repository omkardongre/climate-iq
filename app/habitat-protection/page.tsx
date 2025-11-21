import { HabitatProtectionRecommendations } from '@/components/ui/habitat-protection-recommendations'
import { FloatingButtons } from '@/components/ui/floating-buttons'

export default function HabitatProtectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        <HabitatProtectionRecommendations />
      </div>
      
      <FloatingButtons
        pageTitle="Habitat Protection"
        pageContext="AI-powered habitat protection recommendations with conservation planning, native species guidance, ecosystem restoration advice, and wildlife corridor creation strategies"
      />
    </div>
  )
}
