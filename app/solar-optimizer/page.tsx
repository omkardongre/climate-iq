import { SolarPanelOptimizer } from '@/components/ui/solar-panel-optimizer'
import { FloatingButtons } from '@/components/ui/floating-buttons'

export default function SolarOptimizerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        <SolarPanelOptimizer />
      </div>
      
      <FloatingButtons
        pageTitle="Solar Panel Optimizer"
        pageContext="AI-powered solar optimization with placement recommendations, system sizing calculations, ROI analysis, and energy production estimates for maximum solar investment returns"
      />
    </div>
  )
}
