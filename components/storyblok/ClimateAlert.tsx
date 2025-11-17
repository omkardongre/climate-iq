import { storyblokEditable } from "@storyblok/react/rsc";

interface ClimateAlertProps {
  blok: {
    title: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    region: string;
    alert_type: "bushfire" | "drought" | "flood" | "heatwave" | "general";
    action_required: string;
    _uid: string;
  };
}

export default function ClimateAlert({ blok }: ClimateAlertProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 border-red-500 text-red-900";
      case "high": return "bg-orange-100 border-orange-500 text-orange-900";
      case "medium": return "bg-yellow-100 border-yellow-500 text-yellow-900";
      case "low": return "bg-blue-100 border-blue-500 text-blue-900";
      default: return "bg-gray-100 border-gray-500 text-gray-900";
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "bushfire": return "🔥";
      case "drought": return "🌵";
      case "flood": return "🌊";
      case "heatwave": return "🌡️";
      default: return "⚠️";
    }
  };

  return (
    <div {...storyblokEditable(blok)} className={`p-4 border-l-4 rounded-lg mb-4 ${getSeverityColor(blok.severity)}`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl" role="img" aria-label={blok.alert_type}>
          {getAlertIcon(blok.alert_type)}
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">
            {blok.title} - {blok.region}
          </h3>
          <p className="mb-3">{blok.message}</p>
          {blok.action_required && (
            <div className="bg-white/50 p-3 rounded border">
              <h4 className="font-medium mb-1">Action Required:</h4>
              <p className="text-sm">{blok.action_required}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
