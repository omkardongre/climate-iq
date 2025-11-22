"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthForm } from "@/components/ui/auth-form";
import { useAuth } from "@/components/auth-provider";
import {
  Map,
  MessageCircle,
  Sparkles,
  Building2,
  LogOut,
  Sprout,
  Users,
} from "lucide-react";
import Link from "next/link";
import { FloatingButtons } from "@/components/ui/floating-buttons";
import { LocationSelector } from "@/components/ui/location-selector";
import { useCountryTheme } from "@/hooks/useCountryTheme";

export default function ClimateIQHome() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { themeData, loading: themeLoading } = useCountryTheme();

  const primaryFeatures = [
    {
      id: "climate-map",
      title: "Interactive Climate Map",
      description:
        "Explore live fires, air quality, floods, temperature, solar potential, and vegetation health with real satellite data",
      icon: Map,
      gradient: "from-red-500 to-orange-600",
      href: "/climate-map",
      stats: "6 Live Data Layers",
      badge: "LIVE DATA",
    },
    {
      id: "agriculture",
      title: "Smart Agriculture Hub",
      description:
        "AI-powered farming tools with crop recommendations, carbon tracking, and solar irrigation calculator",
      icon: Sprout,
      gradient: "from-green-500 to-emerald-600",
      href: "/agriculture",
      stats: "Sustainable Farming",
      badge: "REAL DATA",
    },
    {
      id: "urban",
      title: "Urban Sustainability Hub",
      description:
        "AI eco-advisor, waste scanner, smart home tracking, and solar savings calculator for city living",
      icon: Building2,
      gradient: "from-blue-500 to-cyan-600",
      href: "/urban",
      stats: "Smart City Living",
      badge: "NEW",
    },
    {
      id: "community",
      title: "Community Hub",
      description:
        "Join eco-challenges, compete on leaderboards, learn climate topics, and earn badges",
      icon: Users,
      gradient: "from-purple-500 to-pink-600",
      href: "/community",
      stats: "Social Impact",
      badge: "NEW",
    },
    {
      id: "chat",
      title: "AI Climate Advisor",
      description:
        "Personal climate mentor for actionable sustainability guidance",
      icon: MessageCircle,
      gradient: "from-blue-400 to-indigo-600",
      href: "/chat",
      stats: "Climate Guidance",
    },
  ];

  const handleFeatureClick = (feature: any) => {
    // Allow all users to access features directly
    window.location.href = feature.href;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAuthForm && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                ClimateIQ AI
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Sign in to access all climate action features
            </p>
          </div>
          <AuthForm onSuccess={() => setShowAuthForm(false)} />
          <div className="text-center mt-4">
            <Button variant="ghost" onClick={() => setShowAuthForm(false)}>
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-24">
        {/* Background with gradient overlay */}
        <div
          className={`absolute inset-0 ${
            themeData?.background_image_url
              ? "bg-gradient-to-br from-gray-900/20 via-gray-800/30 to-gray-900/40"
              : "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-emerald-900/20 dark:to-teal-900/20"
          }`}
          style={{
            backgroundImage: themeData?.background_image_url
              ? `url(${themeData.background_image_url})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {themeData?.background_image_url && (
            <div className="absolute inset-0 bg-black/60 dark:bg-black/70" />
          )}
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1
                className={`text-4xl sm:text-5xl lg:text-6xl font-bold drop-shadow-lg ${
                  themeData?.background_image_url
                    ? "text-white"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                <span className="block">
                  {themeData?.hero_title || "Climate Action"}
                </span>
                <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">
                  Made Simple
                </span>
              </h1>
              <p
                className={`text-xl sm:text-2xl max-w-3xl mx-auto leading-relaxed drop-shadow-md ${
                  themeData?.background_image_url
                    ? "text-white/90"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {themeData?.hero_subtitle ||
                  "Empowering rural communities with AI-driven environmental solutions. From drought-resistant crops to renewable energy optimization."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Header */}
      <header className="fixed top-4 left-4 right-4 z-50 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg dark:bg-gray-900/70 dark:border-gray-700/20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  ClimateIQ AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Climate Action for Everyone
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* <Link href="/community">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-2"
                >
                  Community Hub
                </Button>
              </Link> */}
              <LocationSelector size="sm" />
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-full">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {user.email?.split("@")[0]}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="rounded-xl"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuthForm(true)}
                  className="rounded-xl border-2"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Primary Features */}
      <section className="pt-16 pb-20 bg-white/50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Accessible AI Tools for Climate Action
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Advanced AI with comprehensive accessibility features to deliver
              practical climate insights for everyone, regardless of abilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {primaryFeatures.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card
                  key={feature.id}
                  className="group cursor-pointer border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-3xl overflow-hidden"
                  onClick={() => handleFeatureClick(feature)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`p-4 bg-gradient-to-r ${feature.gradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      {feature.badge && (
                        <Badge className="mb-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                          {feature.badge}
                        </Badge>
                      )}
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="flex items-center justify-center mb-3">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {feature.stats}
                        </span>
                      </div>
                      {!user && (
                        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>🔒</span>
                            <span>Sign in to save your data</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">ClimateIQ AI</h3>
            </div>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Climate action accessible to everyone through inclusive AI-powered
              tools.
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <span>© ClimateIQ AI</span>
              <span>•</span>
              <span>Accessible Climate Intelligence Platform</span>
            </div>
          </div>
        </div>
      </footer>
      {/* Floating Buttons */}
      <FloatingButtons
        pageTitle="ClimateIQ AI Home"
        pageContext="Main landing page showcasing accessible AI-powered environmental tools including climate dashboard, scanner, chat advisor, goal tracking, and action simulator with comprehensive accessibility features"
      />
    </div>
  );
}
