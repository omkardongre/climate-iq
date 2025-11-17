"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, MapPin, Sprout, TrendingUp, Brain, ChevronDown, ChevronUp,
  CheckCircle2, Sparkles, AlertTriangle, Droplets, DollarSign
} from 'lucide-react';

interface AgentResult {
  name: string;
  role: string;
  analysis: string;
  recommendations: string[];
  confidence: number;
  reasoning_steps: string[];
  sources: string[];
}

interface MultiAgentAdvisor {
  location: { lat: string; lon: string };
  farmSize: number;
  soilType: string;
  currentCrop?: string;
}

export function MultiAgentCropAdvisor() {
  const [location, setLocation] = useState({ lat: '', lon: '' });
  const [farmSize, setFarmSize] = useState(5);
  const [soilType, setSoilType] = useState('unknown');
  const [currentCrop, setCurrentCrop] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [agentResults, setAgentResults] = useState<{
    soil: AgentResult | null;
    weather: AgentResult | null;
    market: AgentResult | null;
  }>({ soil: null, weather: null, market: null });
  
  const [orchestratorResult, setOrchestratorResult] = useState<any>(null);
  const [expandedAgents, setExpandedAgents] = useState<string[]>(['orchestrator']);
  
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toFixed(6),
            lon: position.coords.longitude.toFixed(6),
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleGetAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agriculture/multi-agent-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          farmSize,
          soilType,
          currentCrop,
        }),
      });

      if (!response.ok) throw new Error('Failed to get multi-agent advice');

      const data = await response.json();
      setAgentResults(data.agents);
      setOrchestratorResult(data.orchestrator);
      setExpandedAgents(['orchestrator']); // Start with orchestrator expanded
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (agentName: string) => {
    setExpandedAgents(prev =>
      prev.includes(agentName)
        ? prev.filter(a => a !== agentName)
        : [...prev, agentName]
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const canGetAdvice = location.lat && location.lon && farmSize > 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-purple-200">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="h-16 w-16 text-purple-600" />
              </motion.div>
              <p className="text-lg font-semibold">Multi-Agent Analysis in Progress...</p>
              <div className="w-full max-w-md space-y-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <Droplets className="h-5 w-5 text-blue-600" />
                  <span>Soil Agent analyzing soil composition...</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2"
                >
                  <Sprout className="h-5 w-5 text-green-600" />
                  <span>Weather Agent predicting climate patterns...</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 }}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  <span>Market Agent researching crop prices...</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 }}
                  className="flex items-center gap-2"
                >
                  <Brain className="h-5 w-5 text-purple-600" />
                  <span>Orchestrator coordinating insights...</span>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results if available
  if (orchestratorResult) {
    return (
      <div className="space-y-6">
        {/* Orchestrator Results - Main Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="cursor-pointer" onClick={() => toggleAgent('orchestrator')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="h-6 w-6 text-purple-600" />
                  <div>
                    <CardTitle className="text-xl">Orchestrator - Final Recommendation</CardTitle>
                    <CardDescription>Coordinated insights from all specialist agents</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600">
                    {orchestratorResult.overall_confidence}% Confidence
                  </Badge>
                  {expandedAgents.includes('orchestrator') ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            {expandedAgents.includes('orchestrator') && (
              <CardContent className="space-y-6">
                {/* Top Crop Recommendations */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-green-600" />
                    🏆 Top Recommended Crops
                  </h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {orchestratorResult.top_crops?.map((crop: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 bg-white rounded-lg border-2 border-green-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-bold text-lg text-green-700">#{idx +1} {crop.crop}</p>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm text-muted-foreground">{crop.reason}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action Plan Timeline */}
                {orchestratorResult.action_plan && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">📋 Action Plan</h3>
                    <div className="space-y-2">
                      {Object.entries(orchestratorResult.action_plan).map(([phase, actions]: [string, any]) => (
                        <div key={phase} className="p-3 bg-blue-50 rounded-lg">
                          <p className="font-semibold text-blue-900 mb-2">
                            {phase.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {actions.map((action: string, idx: number) => (
                              <li key={idx} className="text-sm">{action}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Assessment */}
                {orchestratorResult.risk_assessment && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      ⚠️ Risk Assessment
                    </h3>
                    <div className="grid md:grid-cols-3 gap-3">
                      {Object.entries(orchestratorResult.risk_assessment).map(([level, risks]: [string, any]) => {
                        const colorMap: any = {
                          low_risk: 'bg-green-50 border-green-200',
                          medium_risk: 'bg-yellow-50 border-yellow-200',
                          high_risk: 'bg-red-50 border-red-200'
                        };
                        return (
                          <div key={level} className={`p-3 rounded-lg border-2 ${colorMap[level]}`}>
                            <p className="font-semibold mb-2">{level.replace(/_/g, ' ').toUpperCase()}</p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {risks.map((risk: string, idx: number) => (
                                <li key={idx}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Decision Reasoning */}
                <div className="space-y-2 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold">🧠 Decision Reasoning</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {orchestratorResult.decision_reasoning?.map((step: string, idx: number) => (
                      <li key={idx} className="text-sm">{step}</li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Individual Agent Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(agentResults).map(([agentType, agent]) => {
            if (!agent) return null;
            
            const iconMap: any = {
              soil: { icon: Droplets, color: 'blue' },
              weather: { icon: Sprout, color: 'green' },
              market: { icon: DollarSign, color: 'yellow' }
            };
            
            const { icon: Icon, color } = iconMap[agentType];
            
            return (
              <motion.div
                key={agentType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className={`border-2 border-${color}-200`}>
                  <CardHeader 
                    className="cursor-pointer"
                    onClick={() => toggleAgent(agentType)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 text-${color}-600`} />
                        <div>
                          <CardTitle className="text-sm">{agent.name}</CardTitle>
                          <CardDescription className="text-xs">{agent.role}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-semibold ${getConfidenceColor(agent.confidence)}`}>
                          {agent.confidence}%
                        </div>
                        {expandedAgents.includes(agentType) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <Progress value={agent.confidence} className="mt-2" />
                  </CardHeader>

                  {expandedAgents.includes(agentType) && (
                    <CardContent className="space-y-4 text-sm">
                      {/* Analysis */}
                      <div>
                        <p className="font-semibold mb-1">Analysis:</p>
                        <p className="text-muted-foreground">{agent.analysis}</p>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <p className="font-semibold mb-1">Recommendations:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {agent.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-muted-foreground">{rec}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Reasoning Steps */}
                      <div>
                        <p className="font-semibold mb-1">💭 Reasoning:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          {agent.reasoning_steps.map((step, idx) => (
                            <li key={idx} className="text-muted-foreground text-xs">{step}</li>
                          ))}
                        </ol>
                      </div>

                      {/* Sources */}
                      <div>
                        <p className="font-semibold mb-1">📚 Sources:</p>
                        <ul className="space-y-1">
                          {agent.sources.map((source, idx) => (
                            <li key={idx} className="text-xs text-blue-600">• {source}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Start Over Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => {
              setAgentResults({ soil: null, weather: null, market: null });
              setOrchestratorResult(null);
            }}
            variant="outline"
            size="lg"
          >
            Start New Analysis
          </Button>
        </div>
      </div>
    );
  }

  // Input form (unchanged - keeping it simple for now)
  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Multi-Agent Crop Advisor
          </CardTitle>
          <CardDescription>
            Our AI team of 3 specialist agents will analyze your farm and provide coordinated recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Farm Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={location.lat}
                onChange={(e) => setLocation({ ...location, lat: e.target.value })}
                placeholder="Latitude"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <input
                type="text"
                value={location.lon}
                onChange={(e) => setLocation({ ...location, lon: e.target.value })}
                placeholder="Longitude"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <Button onClick={handleGetLocation} variant="outline">
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Farm Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Farm Size (acres)</label>
            <input
              type="number"
              value={farmSize}
              onChange={(e) => setFarmSize(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Soil Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Soil Type (Optional)</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="unknown">🌍 Any/Unknown (Will analyze from satellite)</option>
              <option value="alluvial">🟫 Alluvial - River valleys, plains</option>
              <option value="black">⚫ Black/Dark - Volcanic regions</option>
              <option value="red">🔴 Red - Tropical/sub-tropical</option>
              <option value="laterite">🟠 Laterite - High rainfall areas</option>
              <option value="desert">🟡 Desert/Arid - Dry regions</option>
              <option value="mountain">🟢 Mountain/Forest - Hilly areas</option>
              <option value="saline">⚪ Saline/Alkaline - Coastal/arid</option>
              <option value="peat">🟤 Peat/Marshy - Wetlands</option>
            </select>
            <p className="text-xs text-muted-foreground">
              💡 Not sure? Select "Unknown" and we'll analyze using satellite data
            </p>
          </div>

          {/* Current Crop (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current/Previous Crop (Optional)</label>
            <input
              type="text"
              value={currentCrop}
              onChange={(e) => setCurrentCrop(e.target.value)}
              placeholder="e.g., Wheat, Rice, Corn"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <Button
            onClick={handleGetAdvice}
            disabled={!canGetAdvice || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Get Multi-Agent Advice
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Agent Preview Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="py-6">
          <h3 className="font-semibold mb-4 text-center">Our AI Specialist Team:</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold text-sm">Soil Agent</p>
              <p className="text-xs text-muted-foreground">Soil analysis & amendments</p>
            </div>
            <div className="text-center">
              <Sprout className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-semibold text-sm">Weather Agent</p>
              <p className="text-xs text-muted-foreground">Climate pattern prediction</p>
            </div>
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="font-semibold text-sm">Market Agent</p>
              <p className="text-xs text-muted-foreground">Crop price research</p>
            </div>
            <div className="text-center">
              <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="font-semibold text-sm">Orchestrator</p>
              <p className="text-xs text-muted-foreground">Coordinates all insights</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
