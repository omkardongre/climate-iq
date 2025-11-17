import { storyblokEditable } from "@storyblok/react/rsc";

interface RegionalGuideProps {
  blok: {
    region_name: string;
    state_territory: string;
    climate_description: string;
    key_challenges: string[];
    seasonal_calendar: Array<{
      season: string;
      months: string;
      weather_patterns: string;
      recommended_actions: string;
      _uid: string;
    }>;
    indigenous_knowledge: string;
    local_terminology: Array<{
      term: string;
      definition: string;
      _uid: string;
    }>;
    emergency_contacts: Array<{
      service_name: string;
      phone_number: string;
      description: string;
      _uid: string;
    }>;
    local_resources: Array<{
      resource_name: string;
      location: string;
      contact_info: string;
      services_offered: string;
      _uid: string;
    }>;
    _uid: string;
  };
}

export default function RegionalGuide({ blok }: RegionalGuideProps) {
  const getSeasonIcon = (season: string) => {
    switch (season.toLowerCase()) {
      case "summer": return "☀️";
      case "autumn": case "fall": return "🍂";
      case "winter": return "❄️";
      case "spring": return "🌸";
      case "wet season": return "🌧️";
      case "dry season": return "🌵";
      default: return "🌍";
    }
  };

  return (
    <div {...storyblokEditable(blok)} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{blok.region_name}</h2>
        <p className="text-lg text-gray-600 mb-3">{blok.state_territory}</p>
        <p className="text-gray-700">{blok.climate_description}</p>
      </div>

      {blok.key_challenges && blok.key_challenges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">🎯 Key Climate Challenges</h3>
          <div className="grid md:grid-cols-2 gap-2">
            {blok.key_challenges.map((challenge, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                <span className="text-red-600">⚠️</span>
                <span className="text-red-800">{challenge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {blok.seasonal_calendar && blok.seasonal_calendar.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📅 Seasonal Climate Calendar</h3>
          <div className="grid gap-4">
            {blok.seasonal_calendar.map((season) => (
              <div key={season._uid} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{getSeasonIcon(season.season)}</span>
                  <div>
                    <h4 className="font-semibold text-lg">{season.season}</h4>
                    <p className="text-sm text-gray-600">{season.months}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Weather Patterns:</h5>
                    <p className="text-gray-700">{season.weather_patterns}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Recommended Actions:</h5>
                    <p className="text-gray-700">{season.recommended_actions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {blok.indigenous_knowledge && (
        <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
          <h3 className="text-xl font-semibold text-amber-900 mb-3">🪃 Indigenous Knowledge & Traditional Practices</h3>
          <p className="text-amber-800">{blok.indigenous_knowledge}</p>
        </div>
      )}

      {blok.local_terminology && blok.local_terminology.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🗣️ Local Climate Terminology</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {blok.local_terminology.map((term) => (
              <div key={term._uid} className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <h4 className="font-semibold text-blue-900">{term.term}</h4>
                <p className="text-blue-800 text-sm">{term.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {blok.emergency_contacts && blok.emergency_contacts.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🚨 Emergency Contacts</h3>
            <div className="space-y-3">
              {blok.emergency_contacts.map((contact) => (
                <div key={contact._uid} className="bg-red-50 border border-red-200 p-3 rounded">
                  <h4 className="font-semibold text-red-900">{contact.service_name}</h4>
                  <p className="text-red-800 font-mono text-lg">{contact.phone_number}</p>
                  <p className="text-red-700 text-sm">{contact.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {blok.local_resources && blok.local_resources.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🏪 Local Resources</h3>
            <div className="space-y-3">
              {blok.local_resources.map((resource) => (
                <div key={resource._uid} className="bg-green-50 border border-green-200 p-3 rounded">
                  <h4 className="font-semibold text-green-900">{resource.resource_name}</h4>
                  <p className="text-green-800 text-sm">📍 {resource.location}</p>
                  <p className="text-green-700 text-sm">📞 {resource.contact_info}</p>
                  <p className="text-green-700 text-sm">{resource.services_offered}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
