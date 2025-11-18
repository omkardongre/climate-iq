// Core types for OutbackVision AI application

export interface User {
  id: string;
  email: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  preferences: {
    language: string;
    units: "metric" | "imperial";
    notifications: boolean;
  };
  climate_knowledge_level: "beginner" | "intermediate" | "advanced";
  goals: string[];
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  image_url: string;
  item_category: string;
  carbon_footprint: number;
  alternatives: Alternative[];
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface Alternative {
  name: string;
  carbon_reduction: number;
  description: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Action {
  id: string;
  user_id: string;
  action_type: string;
  impact_score: number;
  completed: boolean;
  date: string;
  notes?: string;
}

export interface ClimateData {
  location: string;
  date: string;
  temperature: number;
  air_quality: number;
  predictions: {
    temperature_trend: number;
    air_quality_trend: number;
    precipitation_probability: number;
  };
  source: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  context?: {
    location?: string;
    recent_scans?: Scan[];
    user_goals?: string[];
  };
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
