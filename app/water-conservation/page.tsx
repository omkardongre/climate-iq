import { WaterConservationStrategy } from '@/components/ui/water-conservation-strategy'
import { FloatingButtons } from '@/components/ui/floating-buttons'

export default function WaterConservationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        <WaterConservationStrategy />
      </div>
      
      <FloatingButtons
        pageTitle="Water Conservation Strategy"
        pageContext="Smart water management strategies with rainwater harvesting calculations, drought preparedness planning, and cost-benefit analysis for sustainable water usage"
      />
    </div>
  )
}
