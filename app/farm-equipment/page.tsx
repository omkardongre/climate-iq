import { FarmEquipmentCalculator } from '@/components/ui/farm-equipment-calculator'
import { FloatingButtons } from '@/components/ui/floating-buttons'

export default function FarmEquipmentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        <FarmEquipmentCalculator />
      </div>
      
      <FloatingButtons
        pageTitle="Farm Carbon Calculator"
        pageContext="Agricultural carbon footprint calculator with equipment analysis, emission tracking, efficiency recommendations, and carbon offset opportunities for sustainable farming"
      />
    </div>
  )
}
