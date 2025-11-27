# 🌍 ClimateIQ AI - Climate Intelligence Platform

AI-powered platform democratizing satellite climate data through multi-agent AI systems and real-time environmental intelligence.

---

## 🚀 Features

### 🗺️ Interactive Climate Map

- 6 real-time satellite layers (NASA FIRMS fires, OpenWeather air quality/temperature, NREL solar, Planet vegetation, flood risk)
- AI Climate Alert System with 5 severity levels
- Auto-resets to GPS location when switching tabs

### 🌾 Smart Agriculture Hub

- **Multi-Agent Crop Advisor**: 4 specialized Gemini AI agents (Soil, Weather, Market, Orchestrator) + Random Forest ML model
- **Carbon Calculator**: Interactive UI with IPCC factors, 50+ countries supported
- **Solar Irrigation**: NREL PVWatts API + AI subsidy search

### 🏙️ Urban Sustainability Hub

- **Gemini Vision Waste Scanner**: Privacy-first image classification (no storage)
- **Smart Home Tracker**: Consumption tracking + AI cost optimization
- **Solar Savings Calculator**: 4-step wizard with ROI analysis
- **Eco-Advisor**: Weather-based tips + city-specific green initiatives

### 👥 Community Hub

- Storyblok CMS learning modules (Climate Basics, Sustainability)
- AI-generated quizzes with modal UI
- Real-time progress tracking

### 🤖 AI Climate Mentor

- Conversational Gemini assistant with country-specific responses

### ♿ Accessibility

- Draggable toolbar with keyboard shortcuts, voice navigation, high contrast themes

---

## 🛠️ Tech Stack

**Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui

**Backend:** Supabase (PostgreSQL, Auth, RLS policies)

**AI/ML:**

- Google Gemini 2.0 Flash Exp (multi-agent coordination, web search, analysis)
- Custom Random Forest Classifier (crop prediction)
- Gemini Vision (waste classification)

**Climate APIs:** NASA FIRMS, OpenWeather, NREL PVWatts, Planet API, SoilGrids, IEA/IPCC 2025

**Maps:** Mapbox GL JS

---

## 📦 Quick Start

```bash
# Clone & install
git clone git@github.com:omkardongre/ClimateIQ-AI.git
cd ClimateIQ-AI
npm install

# Environment setup
cp env.example .env.local

# Run the db.sql migration script in the Supabase SQL Editor

# Start dev server
npm run dev
```

Visit `http://localhost:3000`

---

## 🌟 Key Highlights

✅ **Production Multi-Agent AI**: 4 specialized Gemini agents with autonomous coordination, conflict resolution, confidence scoring

✅ **100% Real Data**: Zero dummy/fallback data - transparent error messages when APIs fail

✅ **Hybrid ML + GenAI**: Random Forest predictions inform Gemini agents for nuanced recommendations

✅ **Global Adaptability**: Auto-detects country from GPS, adapts currency/data sources/emission factors for 50+ countries

✅ **Privacy-First**: Waste scanner analyzes images instantly without storage/tracking

✅ **35+ API Routes**: Comprehensive backend architecture with intelligent caching

---

## 📊 Real-Time Data Sources

- **NASA FIRMS**: Satellite fire/thermal anomaly detection
- **OpenWeather**: Weather, AQI, precipitation forecasts
- **NREL PVWatts**: Solar irradiance calculations
- **Planet API**: Vegetation health (NDVI) metadata
- **SoilGrids**: 250m resolution soil properties (pH, nutrients, organic carbon)
- **IEA/IPCC 2025**: Emission factors for 50+ countries
- **Storyblok**: Educational content CMS

---

## 🚀 Deployment

**Vercel:**

```bash
git push origin main
# Connect to Vercel, add environment variables, auto-deploy
```

---

## 📝 License

MIT License

---

**Built for climate action through AI and satellite data** 🌍
