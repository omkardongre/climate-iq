import { storyblokEditable } from "@storyblok/react/rsc";

interface DroughtTipsProps {
  blok: {
    title: string;
    description: string;
    region: string;
    climate_zone: string;
    tips: Array<{
      tip_title: string;
      tip_content: string;
      difficulty: "easy" | "medium" | "hard";
      water_savings: string;
      _uid: string;
    }>;
    indigenous_knowledge?: string;
    local_resources?: string;
    _uid: string;
  };
}

export default function DroughtTips({ blok }: DroughtTipsProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div {...storyblokEditable(blok)} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{blok.title}</h2>
        <p className="text-gray-600 mb-2">{blok.description}</p>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>📍 Region: {blok.region}</span>
          <span>🌡️ Climate Zone: {blok.climate_zone}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {blok.tips?.map((tip) => (
          <div key={tip._uid} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{tip.tip_title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(tip.difficulty)}`}>
                {tip.difficulty}
              </span>
            </div>
            <p className="text-gray-700 mb-3">{tip.tip_content}</p>
            {tip.water_savings && (
              <div className="bg-blue-50 p-2 rounded text-sm">
                💧 Water Savings: {tip.water_savings}
              </div>
            )}
          </div>
        ))}
      </div>

      {blok.indigenous_knowledge && (
        <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
          <h4 className="font-semibold text-amber-900 mb-2">🪃 Indigenous Knowledge</h4>
          <p className="text-amber-800">{blok.indigenous_knowledge}</p>
        </div>
      )}

      {blok.local_resources && (
        <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <h4 className="font-semibold text-green-900 mb-2">🏪 Local Resources</h4>
          <p className="text-green-800">{blok.local_resources}</p>
        </div>
      )}
    </div>
  );
}
