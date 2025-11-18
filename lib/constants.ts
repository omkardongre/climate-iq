// Constants for OutbackVision AI application

export const CARBON_CATEGORIES = {
  FOOD: "food",
  TRANSPORT: "transport",
  ENERGY: "energy",
  WASTE: "waste",
  CONSUMER_GOODS: "consumer_goods",
  CLOTHING: "clothing",
} as const;

export const IMPACT_LEVELS = {
  LOW: { min: 0, max: 5, color: "green", label: "Low Impact" },
  MEDIUM: { min: 5, max: 15, color: "yellow", label: "Medium Impact" },
  HIGH: { min: 15, max: 50, color: "orange", label: "High Impact" },
  VERY_HIGH: {
    min: 50,
    max: Number.POSITIVE_INFINITY,
    color: "red",
    label: "Very High Impact",
  },
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
] as const;

export const API_ENDPOINTS = {
  GEMINI:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent",
  VISION: "https://vision.googleapis.com/v1/images:annotate",
  WEATHER: "https://api.openweathermap.org/data/2.5",
  AIR_QUALITY: "https://api.airvisual.com/v2",
} as const;

export const ACHIEVEMENT_TYPES = {
  FIRST_SCAN: "first_scan",
  DAILY_STREAK: "daily_streak",
  CARBON_SAVER: "carbon_saver",
  COMMUNITY_LEADER: "community_leader",
  KNOWLEDGE_SEEKER: "knowledge_seeker",
} as const;
