import { storyblokEditable } from "@storyblok/react/rsc";

interface CropProfileProps {
  blok: {
    crop_name: string;
    scientific_name: string;
    description: string;
    climate_zones: string[];
    water_requirements: "low" | "medium" | "high";
    drought_tolerance: "excellent" | "good" | "fair" | "poor";
    growing_season: string;
    planting_tips: string;
    harvest_info: string;
    nutritional_benefits: string;
    local_varieties?: string;
    companion_plants?: string[];
    image?: {
      filename: string;
      alt: string;
    };
    _uid: string;
  };
}

export default function CropProfile({ blok }: CropProfileProps) {
  const getWaterColor = (level: string) => {
    switch (level) {
      case "low": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "high": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getToleranceColor = (tolerance: string) => {
    switch (tolerance) {
      case "excellent": return "text-green-600 bg-green-100";
      case "good": return "text-blue-600 bg-blue-100";
      case "fair": return "text-yellow-600 bg-yellow-100";
      case "poor": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div {...storyblokEditable(blok)} className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      {blok.image && (
        <div className="h-48 bg-gray-200 overflow-hidden">
          <img 
            src={blok.image.filename} 
            alt={blok.image.alt || blok.crop_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{blok.crop_name}</h2>
          <p className="text-gray-500 italic text-sm mb-3">{blok.scientific_name}</p>
          <p className="text-gray-700">{blok.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🌡️ Climate Zones</h4>
              <div className="flex flex-wrap gap-2">
                {blok.climate_zones?.map((zone, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {zone}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">💧 Water Requirements</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getWaterColor(blok.water_requirements)}`}>
                {blok.water_requirements}
              </span>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🌵 Drought Tolerance</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getToleranceColor(blok.drought_tolerance)}`}>
                {blok.drought_tolerance}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📅 Growing Season</h4>
              <p className="text-gray-700">{blok.growing_season}</p>
            </div>

            {blok.companion_plants && blok.companion_plants.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🌱 Companion Plants</h4>
                <div className="flex flex-wrap gap-2">
                  {blok.companion_plants.map((plant, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      {plant}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">🌱 Planting Tips</h4>
            <p className="text-gray-700">{blok.planting_tips}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">🚜 Harvest Information</h4>
            <p className="text-gray-700">{blok.harvest_info}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">🥗 Nutritional Benefits</h4>
            <p className="text-gray-700">{blok.nutritional_benefits}</p>
          </div>

          {blok.local_varieties && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
              <h4 className="font-semibold text-amber-900 mb-2">🏡 Local Varieties</h4>
              <p className="text-amber-800">{blok.local_varieties}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
