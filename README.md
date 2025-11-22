# 🌍 ClimateIQ AI - Intelligent Climate Action Platform

A comprehensive climate intelligence platform combining real-time environmental data, AI-powered tools, and community-driven learning to empower climate action.

---

## 🚀 **Key Features**

### 🏠 **Home Dashboard**

- **5 Feature Cards**: Interactive climate map, smart agriculture hub, urban sustainability hub, community hub, AI climate mentor
- **Location-Based**: Personalized content based on your region
- **Quick Navigation**: Easy access to all major features

### 🗺️ **Interactive Climate Map**

- **6 Real Data Layers**: NASA FIRMS fires, OpenWeather air quality, flood risk, temperature anomalies, NREL solar potential, Planet NDVI vegetation
- **AI Region Analysis**: Gemini-powered climate insights for any location
- **Future-Proof Score**: AI-generated climate resilience ratings
- **Real-time Updates**: Live satellite and weather data

### 🌾 **Smart Agriculture Hub**

- **AI Crop Planner**: Gemini AI recommendations using SoilGrids soil data and OpenWeather climate
- **Carbon Tracker**: IPCC emission factors for fuel, fertilizer, livestock with AI reduction tips
- **Solar Irrigation**: NREL PVWatts API for solar pump sizing and ROI calculation
- **Community**: Storyblok CMS for agricultural news and updates

### 🏙️ **Urban Sustainability Hub**

- **5 Tools**: Eco-advisor (AI tips), waste scanner (Gemini Vision), smart home tracker, solar analysis, achievements
- **OpenWeather API**: Live air quality and weather-based recommendations
- **NREL Solar Calculator**: Rooftop solar potential and ROI analysis
- **Gamification**: Streaks, badges, and leaderboard for sustainability actions

### 👥 **Community Hub & Learning System**

- **9 Educational Lessons**: Storyblok-powered content with rich text and images
  - 5 Climate Basics lessons
  - 4 Sustainability lessons
- **Dedicated Lesson Pages**: Full-screen reading experience with progress tracking
- **Per-Lesson Progress**: Track completion time and status for each lesson
- **AI-Generated Quizzes**: Gemini creates custom quizzes from lesson content
- **Community Content**: Events, news, and expert updates from Storyblok CMS
- **Reset Progress**: Start learning modules fresh anytime

### 🤖 **AI Climate Mentor**

- **Conversational AI**: Personalized climate advice powered by Gemini
- **Context-Aware**: Responses based on your location and needs
- **Voice Input**: Speak your questions naturally
- **Text-to-Speech**: Listen to AI responses

### ♿ **Comprehensive Accessibility**

- **Keyboard Navigation**: Full keyboard shortcuts (Alt+1-5, Alt+H, Ctrl+/)
- **Voice Navigation**: Voice commands for page navigation
- **High Contrast**: Optimized visibility across all themes
- **Screen Reader**: Semantic HTML with ARIA labels
- **Focus Management**: Proper tab order and focus indicators

---

## 🛠️ **Tech Stack**

- **Framework**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **CMS**: Storyblok (Community content, Learning lessons)
- **AI**: Google Gemini (Quiz generation, recommendations, analysis)
- **Database**: Supabase (Auth, Progress tracking, User data)
- **Maps**: Mapbox GL JS
- **Real APIs**: NASA FIRMS, OpenWeather, NREL PVWatts, Planet, SoilGrids

---

## 📦 **Quick Start**

```bash
# Clone repository
git clone https://github.com/yourusername/ClimateIQ-AI.git
cd ClimateIQ-AI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys (see API Keys section below)

# Run database migration in Supabase SQL Editor

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## 📊 **Real Data Sources**

- **NASA FIRMS**: Satellite fire detection
- **OpenWeather**: Air quality index, weather data
- **NREL PVWatts**: Solar potential calculations
- **Planet API**: NDVI vegetation index
- **SoilGrids**: Soil properties (pH, organic carbon)
- **IPCC**: Emission factors for carbon calculations
- **Storyblok**: Educational content and community updates

---

## 🚀 **Deployment**

**Vercel (Recommended):**

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

## 📝 **License**

MIT License - Feel free to use for your projects

---

## 🙏 **Credits**

- **Storyblok** - Headless CMS
- **Google Gemini** - AI intelligence
- **Supabase** - Backend infrastructure
- **shadcn/ui** - Component library
- **Next.js** - React framework

---

**Built with ❤️ for climate action and environmental awareness**
