import { storyblokEditable } from "@storyblok/react/rsc";

interface WaterSavingGuideProps {
  blok: {
    title: string;
    description: string;
    region: string;
    property_type: "residential" | "farm" | "commercial" | "community";
    strategies: Array<{
      strategy_name: string;
      description: string;
      implementation_cost: "low" | "medium" | "high";
      water_savings_percentage: string;
      payback_period: string;
      difficulty: "easy" | "medium" | "hard";
      materials_needed: string;
      _uid: string;
    }>;
    rainwater_harvesting?: {
      roof_area_sqm: string;
      annual_rainfall_mm: string;
      potential_collection_litres: string;
      tank_size_recommendation: string;
    };
    local_rebates?: string;
    maintenance_tips?: string;
    _uid: string;
  };
}

export default function WaterSavingGuide({ blok }: WaterSavingGuideProps) {
  const getCostColor = (cost: string) => {
    switch (cost) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "🟢";
      case "medium": return "🟡";
      case "hard": return "🔴";
      default: return "⚪";
    }
  };

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case "residential": return "🏠";
      case "farm": return "🚜";
      case "commercial": return "🏢";
      case "community": return "🏘️";
      default: return "🏗️";
    }
  };

  return (
    <div {...storyblokEditable(blok)} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{blok.title}</h2>
        <p className="text-gray-600 mb-3">{blok.description}</p>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>📍 {blok.region}</span>
          <span>{getPropertyIcon(blok.property_type)} {blok.property_type}</span>
        </div>
      </div>

      {blok.rainwater_harvesting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">🌧️ Rainwater Harvesting Potential</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Roof Area:</strong> {blok.rainwater_harvesting.roof_area_sqm} m²</p>
              <p><strong>Annual Rainfall:</strong> {blok.rainwater_harvesting.annual_rainfall_mm} mm</p>
            </div>
            <div>
              <p><strong>Potential Collection:</strong> {blok.rainwater_harvesting.potential_collection_litres} L/year</p>
              <p><strong>Recommended Tank:</strong> {blok.rainwater_harvesting.tank_size_recommendation}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">💧 Water Saving Strategies</h3>
        <div className="grid gap-4">
          {blok.strategies?.map((strategy) => (
            <div key={strategy._uid} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-lg">{strategy.strategy_name}</h4>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCostColor(strategy.implementation_cost)}`}>
                    {strategy.implementation_cost} cost
                  </span>
                  <span className="text-lg" title={`${strategy.difficulty} difficulty`}>
                    {getDifficultyIcon(strategy.difficulty)}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{strategy.description}</p>
              
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-green-50 p-2 rounded">
                  <strong className="text-green-800">Water Savings:</strong>
                  <br />
                  <span className="text-green-700">{strategy.water_savings_percentage}</span>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <strong className="text-blue-800">Payback Period:</strong>
                  <br />
                  <span className="text-blue-700">{strategy.payback_period}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <strong className="text-gray-800">Materials:</strong>
                  <br />
                  <span className="text-gray-700">{strategy.materials_needed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {blok.local_rebates && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-4">
          <h4 className="font-semibold text-green-900 mb-2">💰 Local Rebates & Incentives</h4>
          <p className="text-green-800">{blok.local_rebates}</p>
        </div>
      )}

      {blok.maintenance_tips && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
          <h4 className="font-semibold text-amber-900 mb-2">🔧 Maintenance Tips</h4>
          <p className="text-amber-800">{blok.maintenance_tips}</p>
        </div>
      )}
    </div>
  );
}
