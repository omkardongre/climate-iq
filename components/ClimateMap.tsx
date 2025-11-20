"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Wind, Droplets, Loader2, AlertTriangle, Layers, Leaf, Sun, Waves, Thermometer, Sparkles } from 'lucide-react';

// Set Mapbox access token
if (typeof window !== 'undefined') {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
  if (token) {
    mapboxgl.accessToken = token;
    console.log('Mapbox token loaded:', token.substring(0, 20) + '...');
  } else {
    console.error('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN not found in environment');
  }
}

interface FireData {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: number | string;
  frp: number;
  acq_date: string;
  acq_time: string;
}

interface FireStats {
  totalFires: number;
  highConfidence: number;
  averageBrightness: number;
  totalFirePower: number;
  lastUpdate: string;
}

interface FireRisk {
  level: 'none' | 'low' | 'moderate' | 'high' | 'extreme';
  color: string;
  description: string;
}

export function ClimateMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fires, setFires] = useState<FireData[]>([]);
  const [stats, setStats] = useState<FireStats | null>(null);
  const [risk, setRisk] = useState<FireRisk | null>(null);
  const [activeLayer, setActiveLayer] = useState<'fires' | 'air' | 'floods' | 'temperature' | 'solar' | 'ndvi'>('fires');
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['fires']));
  const [loadingFires, setLoadingFires] = useState(false);
  const [airQualityData, setAirQualityData] = useState<any>(null);
  const [loadingAir, setLoadingAir] = useState(false);
  // Removed: waterStressData, ndviData, solarData (fake data layers)
  const [floodData, setFloodData] = useState<any>(null);
  const [loadingFlood, setLoadingFlood] = useState(false);
  const [temperatureData, setTemperatureData] = useState<any>(null);
  const [loadingTemperature, setLoadingTemperature] = useState(false);
  const [solarData, setSolarData] = useState<any>(null);
  const [loadingSolar, setLoadingSolar] = useState(false);
  const [ndviData, setNdviData] = useState<any>(null);
  const [loadingNdvi, setLoadingNdvi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastBounds = useRef<{ west: number; east: number; north: number; south: number } | null>(null);
  const centerMarker = useRef<mapboxgl.Marker | null>(null);
  const activeLayerRef = useRef(activeLayer);

  // Keep activeLayerRef in sync
  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

  // Update center marker (defined before useEffect)
  const updateCenterMarker = () => {
    if (!map.current) return;
    
    const center = map.current.getCenter();
    
    // Remove existing center marker
    if (centerMarker.current) {
      centerMarker.current.remove();
    }
    
    // Only show center marker for non-fire layers
    if (activeLayerRef.current !== 'fires') {
      // Create a custom marker element
      const el = document.createElement('div');
      el.className = 'center-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3b82f6';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.3s ease';
      
      centerMarker.current = new mapboxgl.Marker(el)
        .setLngLat([center.lng, center.lat])
        .addTo(map.current);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Prevent double initialization

    if (!mapboxgl.accessToken) {
      setError('Mapbox access token not configured. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local');
      setLoading(false);
      return;
    }

    let isMounted = true;

    try {
      // Try to get user's location
      let initialCenter: [number, number] = [78.9629, 20.5937]; // India center as fallback
      let initialZoom = 4;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (map.current) {
              map.current.flyTo({
                center: [position.coords.longitude, position.coords.latitude],
                zoom: 8,
                duration: 2000
              });
            }
          },
          (error) => {
            console.log('Geolocation error:', error.message, '- using default location');
          }
        );
      }

      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: initialCenter,
        zoom: initialZoom,
      });

      mapInstance.on('load', () => {
        if (!isMounted) return;
        console.log('Map loaded successfully');
        map.current = mapInstance;
        setLoading(false);
        loadFireData();
        
        // Add click handler for map clicks
        mapInstance.on('click', (e) => {
          const currentLayer = activeLayerRef.current;
          console.log('Map clicked, current layer:', currentLayer);
          if (currentLayer !== 'fires') {
            // Update center marker to clicked location with smooth transition
            if (centerMarker.current) {
              const element = centerMarker.current.getElement();
              if (element) {
                element.style.transition = 'all 0.3s ease';
              }
              centerMarker.current.setLngLat([e.lngLat.lng, e.lngLat.lat]);
            } else {
              // Create marker at clicked location
              const el = document.createElement('div');
              el.className = 'center-marker';
              el.style.width = '24px';
              el.style.height = '24px';
              el.style.borderRadius = '50%';
              el.style.backgroundColor = '#3b82f6';
              el.style.border = '3px solid white';
              el.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
              el.style.cursor = 'pointer';
              el.style.transition = 'all 0.3s ease';
              
              centerMarker.current = new mapboxgl.Marker(el)
                .setLngLat([e.lngLat.lng, e.lngLat.lat])
                .addTo(mapInstance);
            }
            
            // Reload data for clicked location
            console.log('Reloading data for clicked location');
            if (currentLayer === 'air') {
              loadAirQualityData();
            } else if (currentLayer === 'floods') {
              loadFloodData();
            } else if (currentLayer === 'temperature') {
              loadTemperatureData();
            }
          }
        });
      });

      // Reload data when map moves (debounced + bounds check)
      mapInstance.on('moveend', () => {
        if (!isMounted) return;
        
        // Clear previous timeout
        if (moveTimeout.current) {
          clearTimeout(moveTimeout.current);
        }
        
        // Debounce: wait after user stops moving
        moveTimeout.current = setTimeout(() => {
          const bounds = mapInstance.getBounds();
          if (!bounds) return;
          
          const currentBounds = {
            west: bounds.getWest(),
            east: bounds.getEast(),
            north: bounds.getNorth(),
            south: bounds.getSouth(),
          };
          
          // Only reload if bounds changed significantly (>10% of viewport)
          if (lastBounds.current) {
            const widthChange = Math.abs(currentBounds.east - currentBounds.west);
            const heightChange = Math.abs(currentBounds.north - currentBounds.south);
            const lastWidth = Math.abs(lastBounds.current.east - lastBounds.current.west);
            const lastHeight = Math.abs(lastBounds.current.north - lastBounds.current.south);
            
            const widthDiff = Math.abs(widthChange - lastWidth) / lastWidth;
            const heightDiff = Math.abs(heightChange - lastHeight) / lastHeight;
            
            // Skip reload if change is less than 10%
            if (widthDiff < 0.1 && heightDiff < 0.1) {
              console.log('Bounds change too small, skipping reload');
              return;
            }
          }
          
          console.log('Map moved significantly, reloading data for layer:', activeLayerRef.current);
          lastBounds.current = currentBounds;
          
          // Use ref to get current layer
          const currentLayer = activeLayerRef.current;
          
          if (currentLayer === 'fires') {
            loadFireData();
          } else if (currentLayer === 'air') {
            updateCenterMarker();
            loadAirQualityData();
          } else if (currentLayer === 'floods') {
            updateCenterMarker();
            loadFloodData();
          } else if (currentLayer === 'temperature') {
            updateCenterMarker();
            loadTemperatureData();
          }
        }, 3000); // 3 seconds debounce
      });

      mapInstance.on('error', (e) => {
        console.error('Mapbox error:', e);
        if (!isMounted) return;
        setError(`Map error: ${e.error?.message || 'Unknown error'}`);
        setLoading(false);
      });

      // Add navigation controls
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add fullscreen control
      mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Store reference
      map.current = mapInstance;

    } catch (err: any) {
      console.error('Map initialization error:', err);
      setError(`Failed to initialize map: ${err.message}`);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (moveTimeout.current) {
        clearTimeout(moveTimeout.current);
      }
      // Clean up markers
      fireMarkerRefs.current.forEach(marker => marker.remove());
      fireMarkerRefs.current = [];
      if (centerMarker.current) {
        centerMarker.current.remove();
        centerMarker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Load fire data when map moves
  const loadFireData = async () => {
    if (!map.current) return;

    setLoadingFires(true);
    try {
      const bounds = map.current.getBounds();
      if (!bounds) return;
      
      console.log('Fetching fires for bounds:', {
        west: bounds.getWest().toFixed(2),
        south: bounds.getSouth().toFixed(2),
        east: bounds.getEast().toFixed(2),
        north: bounds.getNorth().toFixed(2),
      });
      
      const response = await fetch(
        `/api/map/fires?mode=bounds&minLon=${bounds.getWest()}&minLat=${bounds.getSouth()}&maxLon=${bounds.getEast()}&maxLat=${bounds.getNorth()}&days=1`
      );

      const data = await response.json();
      
      console.log(`Received ${data.fires?.length || 0} fires`);
      
      if (data.fires) {
        setFires(data.fires);
        setStats(data.stats);
        setRisk(data.risk);
        updateFireMarkers(data.fires);
      }
    } catch (err: any) {
      console.error('Error loading fire data:', err);
    } finally {
      setLoadingFires(false);
    }
  };

  // Store fire marker references
  const fireMarkerRefs = useRef<mapboxgl.Marker[]>([]);

  // Update fire markers on map (optimized)
  const updateFireMarkers = (fireData: FireData[]) => {
    if (!map.current) return;

    // Remove existing fire markers properly
    fireMarkerRefs.current.forEach(marker => marker.remove());
    fireMarkerRefs.current = [];

    // Limit markers to prevent performance issues
    const maxMarkers = 1000;
    const limitedData = fireData.length > maxMarkers 
      ? fireData.slice(0, maxMarkers)
      : fireData;

    if (fireData.length > maxMarkers) {
      console.warn(`Showing ${maxMarkers} of ${fireData.length} fires for performance`);
    }

    // Add new fire markers
    limitedData.forEach((fire) => {
      const el = document.createElement('div');
      el.className = 'fire-marker';
      
      // Size based on fire radiative power
      const size = Math.min(Math.max(fire.frp / 10, 8), 30);
      
      // Color based on confidence
      let color = '#f59e0b'; // yellow for low
      if (typeof fire.confidence === 'number') {
        if (fire.confidence >= 80) color = '#dc2626'; // red for high
        else if (fire.confidence >= 50) color = '#f97316'; // orange for medium
      } else if (fire.confidence === 'h') {
        color = '#dc2626';
      }

      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.backgroundColor = color;
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 10px rgba(255, 100, 0, 0.5)';
      el.style.cursor = 'pointer';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold text-sm mb-1">Active Fire</h3>
          <p class="text-xs"><strong>Brightness:</strong> ${fire.brightness}K</p>
          <p class="text-xs"><strong>Power:</strong> ${fire.frp} MW</p>
          <p class="text-xs"><strong>Confidence:</strong> ${fire.confidence}</p>
          <p class="text-xs"><strong>Date:</strong> ${fire.acq_date} ${fire.acq_time}</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([fire.longitude, fire.latitude])
        .setPopup(popup)
        .addTo(map.current!);
      
      fireMarkerRefs.current.push(marker);
    });
  };

  // Load air quality data
  const loadAirQualityData = async () => {
    if (!map.current) return;

    setLoadingAir(true);
    try {
      // Get location from marker if it exists, otherwise use map center
      let lat, lng;
      if (centerMarker.current) {
        const lngLat = centerMarker.current.getLngLat();
        lat = lngLat.lat;
        lng = lngLat.lng;
      } else {
        const center = map.current.getCenter();
        lat = center.lat;
        lng = center.lng;
      }
      
      console.log('Fetching air quality for:', lat.toFixed(2), lng.toFixed(2));
      
      const response = await fetch(
        `/api/map/air-quality?mode=point&lat=${lat}&lon=${lng}`
      );

      const data = await response.json();
      
      console.log('Air quality data:', data);
      setAirQualityData(data);
      
    } catch (err: any) {
      console.error('Error loading air quality data:', err);
    } finally {
      setLoadingAir(false);
    }
  };

  // Removed: loadWaterStressData, loadNDVIData, loadSolarData (fake data functions)

  // Load flood risk data
  const loadFloodData = async () => {
    if (!map.current) return;
    setLoadingFlood(true);
    try {
      // Get location from marker if it exists, otherwise use map center
      let lat, lng;
      if (centerMarker.current) {
        const lngLat = centerMarker.current.getLngLat();
        lat = lngLat.lat;
        lng = lngLat.lng;
      } else {
        const center = map.current.getCenter();
        lat = center.lat;
        lng = center.lng;
      }
      console.log('Fetching flood risk for:', lat.toFixed(2), lng.toFixed(2));
      const response = await fetch(`/api/map/flood-risk?lat=${lat}&lon=${lng}`);
      const data = await response.json();
      setFloodData(data);
    } catch (err: any) {
      console.error('Error loading flood data:', err);
    } finally {
      setLoadingFlood(false);
    }
  };

  // Load temperature anomaly data
  const loadTemperatureData = async () => {
    if (!map.current) return;
    setLoadingTemperature(true);
    try {
      // Get location from marker if it exists, otherwise use map center
      let lat, lng;
      if (centerMarker.current) {
        const lngLat = centerMarker.current.getLngLat();
        lat = lngLat.lat;
        lng = lngLat.lng;
      } else {
        const center = map.current.getCenter();
        lat = center.lat;
        lng = center.lng;
      }
      console.log('Fetching temperature anomaly for:', lat.toFixed(2), lng.toFixed(2));
      const response = await fetch(`/api/map/temperature?lat=${lat}&lon=${lng}`);
      const data = await response.json();
      setTemperatureData(data);
    } catch (err: any) {
      console.error('Error loading temperature data:', err);
    } finally {
      setLoadingTemperature(false);
    }
  };

  // Load solar potential data
  const loadSolarData = async () => {
    if (!map.current) return;
    setLoadingSolar(true);
    try {
      const bounds = map.current.getBounds();
      if (!bounds) {
        setLoadingSolar(false);
        return;
      }
      const boundsStr = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      
      console.log('Fetching solar potential for bounds:', boundsStr);
      const response = await fetch(`/api/climate/solar-potential?bounds=${boundsStr}`);
      const data = await response.json();
      
      if (data.solarData && data.solarData.length > 0) {
        setSolarData(data.solarData);
        
        // Add solar markers to map
        data.solarData.forEach((point: any) => {
          const el = document.createElement('div');
          el.className = 'solar-marker';
          
          // Color based on solar radiation (kWh/m²/day)
          const radiation = point.solarRadiation;
          let color = '#fbbf24'; // yellow
          if (radiation > 6) color = '#f59e0b'; // orange
          if (radiation > 7) color = '#dc2626'; // red
          
          el.style.width = '16px';
          el.style.height = '16px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = color;
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 0 8px rgba(0,0,0,0.3)';
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([point.lng, point.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px;">
                  <strong>☀️ Solar Potential</strong><br/>
                  <strong>Annual Production:</strong> ${point.annualProduction.toFixed(0)} kWh/year<br/>
                  <strong>Solar Radiation:</strong> ${point.solarRadiation.toFixed(2)} kWh/m²/day<br/>
                  <strong>Capacity Factor:</strong> ${point.capacityFactor.toFixed(1)}%
                </div>
              `)
            )
            .addTo(map.current!);
        });
      }
    } catch (err: any) {
      console.error('Error loading solar data:', err);
    } finally {
      setLoadingSolar(false);
    }
  };

  // Load NDVI (vegetation health) data
  const loadNdviData = async () => {
    if (!map.current) return;
    setLoadingNdvi(true);
    try {
      const center = map.current.getCenter();
      
      console.log('Fetching NDVI data for location:', center.lat, center.lng);
      const response = await fetch(`/api/map/ndvi?lat=${center.lat}&lon=${center.lng}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch NDVI data');
      }
      
      const data = await response.json();
      setNdviData(data);
      
      // Add NDVI marker to map
      const el = document.createElement('div');
      el.className = 'ndvi-marker';
      
      // Color based on NDVI value (0-1 scale)
      const ndvi = data.ndvi;
      let color = '#dc2626'; // red (poor)
      if (ndvi > 0.6) color = '#16a34a'; // green (excellent)
      else if (ndvi > 0.4) color = '#84cc16'; // lime (good)
      else if (ndvi > 0.2) color = '#eab308'; // yellow (fair)
      
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(0,0,0,0.4)';
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([data.lng, data.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong>🌿 Vegetation Health</strong><br/>
              <strong>NDVI:</strong> ${data.ndvi.toFixed(3)}<br/>
              <strong>Health:</strong> ${data.healthLevel}<br/>
              <strong>Land Cover:</strong> ${data.landCover}<br/>
              <strong>Cloud Cover:</strong> ${data.cloudCover.toFixed(1)}%<br/>
              <small>Updated: ${new Date(data.lastUpdated).toLocaleDateString()}</small>
            </div>
          `)
        )
        .addTo(map.current!);
    } catch (err: any) {
      console.error('Error loading NDVI data:', err);
      // Show error to user
      alert('No recent clear satellite imagery available for this location. Try a different area or check back later.');
    } finally {
      setLoadingNdvi(false);
    }
  };

  // AI Region Analysis
  const handleAiAnalysis = async () => {
    if (!map.current) return;
    
    setLoadingAi(true);
    try {
      const center = map.current.getCenter();
      const bounds = map.current.getBounds();
      if (!bounds) {
        setLoadingAi(false);
        return;
      }
      
      // Gather data based on active layer (layer-specific analysis)
      const regionData: any = {
        location: {
          lat: center.lat,
          lon: center.lng,
          bounds: {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          },
        },
        activeLayer: activeLayer, // Tell AI which layer is active
      };

      // Add data for the active layer
      if (activeLayer === 'fires' && stats) {
        regionData.fires = stats;
      } else if (activeLayer === 'air' && airQualityData) {
        regionData.airQuality = airQualityData;
      } else if (activeLayer === 'floods' && floodData) {
        regionData.flood = floodData;
      } else if (activeLayer === 'temperature' && temperatureData) {
        regionData.temperature = temperatureData;
      } else if (activeLayer === 'solar' && solarData && solarData.length > 0) {
        // Calculate solar averages for the region
        const avgRadiation = solarData.reduce((sum: number, p: any) => sum + p.solarRadiation, 0) / solarData.length;
        const avgProduction = solarData.reduce((sum: number, p: any) => sum + p.annualProduction, 0) / solarData.length;
        const avgCapacityFactor = solarData.reduce((sum: number, p: any) => sum + p.capacityFactor, 0) / solarData.length;
        
        regionData.solar = {
          averageRadiation: avgRadiation,
          averageProduction: avgProduction,
          averageCapacityFactor: avgCapacityFactor,
          dataPoints: solarData.length,
          suitability: avgRadiation > 6.5 ? 'Excellent' : avgRadiation > 5.5 ? 'Very Good' : avgRadiation > 4.5 ? 'Good' : 'Moderate',
        };
      } else if (activeLayer === 'ndvi' && ndviData) {
        regionData.ndvi = ndviData;
      }
      
      const response = await fetch('/api/map/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regionData),
      });
      
      if (!response.ok) {
        throw new Error('AI analysis failed');
      }
      
      const analysis = await response.json();
      setAiAnalysis(analysis);
      setShowAiPanel(true);
    } catch (err: any) {
      console.error('AI analysis error:', err);
      alert('Failed to analyze region. Please try again.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Handle layer toggle
  const handleLayerChange = (layer: 'fires' | 'air' | 'floods' | 'temperature' | 'solar' | 'ndvi') => {
    setActiveLayer(layer);
    
    // Show/hide fire markers properly
    fireMarkerRefs.current.forEach(marker => {
      const element = marker.getElement();
      if (element) {
        element.style.display = layer === 'fires' ? 'block' : 'none';
      }
    });
    
    // Load data for selected layer
    if (layer === 'fires') {
      // Remove center marker for fire layer
      if (centerMarker.current) {
        centerMarker.current.remove();
        centerMarker.current = null;
      }
      loadFireData();
    } else if (layer === 'air') {
      updateCenterMarker();
      loadAirQualityData();
    } else if (layer === 'floods') {
      updateCenterMarker();
      loadFloodData();
    } else if (layer === 'temperature') {
      updateCenterMarker();
      loadTemperatureData();
    } else if (layer === 'solar') {
      // Remove center marker for solar layer (shows grid)
      if (centerMarker.current) {
        centerMarker.current.remove();
        centerMarker.current = null;
      }
      loadSolarData();
    } else if (layer === 'ndvi') {
      updateCenterMarker();
      loadNdviData();
    }
  };

  // Refresh data
  const handleRefresh = () => {
    if (activeLayer === 'fires') {
      loadFireData();
    } else if (activeLayer === 'air') {
      loadAirQualityData();
    } else if (activeLayer === 'floods') {
      loadFloodData();
    } else if (activeLayer === 'temperature') {
      loadTemperatureData();
    } else if (activeLayer === 'solar') {
      loadSolarData();
    } else if (activeLayer === 'ndvi') {
      loadNdviData();
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Map Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure to add your Mapbox access token to .env.local
          </p>
        </CardContent>
      </Card>
    );
  }

  const layerConfig = [
    { id: 'fires', label: 'Fires', icon: Flame, color: 'text-orange-500', available: true },
    { id: 'air', label: 'Air Quality', icon: Wind, color: 'text-blue-500', available: true },
    { id: 'floods', label: 'Flood Risk', icon: Waves, color: 'text-blue-600', available: true },
    { id: 'temperature', label: 'Temperature', icon: Thermometer, color: 'text-red-500', available: true },
    { id: 'solar', label: 'Solar Potential', icon: Sun, color: 'text-yellow-500', available: true },
    { id: 'ndvi', label: 'Vegetation', icon: Leaf, color: 'text-green-500', available: true },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Layer Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5" />
            Map Layers
          </CardTitle>
          <CardDescription>Select data layers to visualize on the map</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {layerConfig.map((layer) => {
              const Icon = layer.icon;
              const isActive = activeLayer === layer.id;
              const isLoading = isActive && (
                (layer.id === 'fires' && loadingFires) ||
                (layer.id === 'air' && loadingAir) ||
                (layer.id === 'floods' && loadingFlood) ||
                (layer.id === 'temperature' && loadingTemperature) ||
                (layer.id === 'solar' && loadingSolar) ||
                (layer.id === 'ndvi' && loadingNdvi)
              );
              
              return (
                <Button
                  key={layer.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => layer.available && handleLayerChange(layer.id as any)}
                  disabled={!layer.available || isLoading}
                  className={`flex flex-col items-center gap-1 h-auto py-3 ${
                    !layer.available ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : layer.color}`} />
                  )}
                  <span className="text-xs">{layer.label}</span>
                  {!layer.available && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-1">
                      Coming Soon
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="w-full"
            size="lg"
          >
            {loadingAi ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Region...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                AI Region Analysis
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Get AI-powered insights about this region's climate risks and future-proof score
          </p>
        </CardContent>
      </Card>

      {/* AI Analysis Panel */}
      {showAiPanel && aiAnalysis && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Climate Analysis
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAiPanel(false)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Assessment */}
            <div>
              <h4 className="font-semibold mb-2">Overall Assessment</h4>
              <p className="text-sm text-muted-foreground">{aiAnalysis.assessment}</p>
            </div>

            {/* Future-Proof Score */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Future-Proof Score</h4>
                <Badge 
                  variant={aiAnalysis.futureProofScore >= 70 ? 'default' : aiAnalysis.futureProofScore >= 40 ? 'secondary' : 'destructive'}
                  className="text-lg px-3 py-1"
                >
                  {aiAnalysis.futureProofScore}/100
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{aiAnalysis.scoreExplanation}</p>
            </div>

            {/* Key Risks */}
            <div>
              <h4 className="font-semibold mb-2">Key Risks</h4>
              <div className="space-y-2">
                {aiAnalysis.risks.map((risk: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded">
                    <Badge 
                      variant={
                        risk.severity === 'extreme' ? 'destructive' :
                        risk.severity === 'high' ? 'destructive' :
                        risk.severity === 'medium' ? 'secondary' : 'default'
                      }
                      className="mt-0.5"
                    >
                      {risk.severity}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{risk.risk}</p>
                      <p className="text-xs text-muted-foreground">{risk.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold mb-2">Actionable Recommendations</h4>
              <div className="space-y-2">
                {aiAnalysis.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium mb-1">{rec.action}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Impact: {rec.impact}</span>
                      <span>•</span>
                      <span>Timeframe: {rec.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Panel - Fires */}
      {activeLayer === 'fires' && stats && risk && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Fires</CardDescription>
              <CardTitle className="text-3xl">{stats.totalFires}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>High Confidence</CardDescription>
              <CardTitle className="text-3xl text-red-500">{stats.highConfidence}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Fire Power</CardDescription>
              <CardTitle className="text-3xl">{stats.totalFirePower} MW</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Risk Level</CardDescription>
              <div className="flex items-center gap-2">
                <Badge 
                  style={{ backgroundColor: risk.color }}
                  className="text-white"
                >
                  {risk.level.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Stats Panel - Air Quality */}
      {activeLayer === 'air' && airQualityData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Air Quality Index</CardDescription>
              <CardTitle className="text-3xl" style={{ color: airQualityData.color }}>
                {airQualityData.aqi}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>PM2.5</CardDescription>
              <CardTitle className="text-3xl">{airQualityData.pollutants.pm25.toFixed(1)}</CardTitle>
              <p className="text-xs text-muted-foreground">μg/m³</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>PM10</CardDescription>
              <CardTitle className="text-3xl">{airQualityData.pollutants.pm10.toFixed(1)}</CardTitle>
              <p className="text-xs text-muted-foreground">μg/m³</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Level</CardDescription>
              <div className="flex items-center gap-2">
                <Badge 
                  style={{ backgroundColor: airQualityData.color }}
                  className="text-white"
                >
                  {airQualityData.level.toUpperCase().replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Removed: Water Stress, NDVI, Solar panels (fake data) */}

      {/* Stats Panel - Flood Risk (REAL DATA) */}
      {activeLayer === 'floods' && floodData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Flood Risk Score</CardDescription>
              <CardTitle className="text-3xl" style={{ color: floodData.color }}>
                {floodData.riskScore}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Risk Level</CardDescription>
              <Badge style={{ backgroundColor: floodData.color }} className="text-white">
                {floodData.riskLevel.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">{floodData.description}</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>24h Precipitation</CardDescription>
              <CardTitle className="text-3xl">{floodData.precipitation24h}</CardTitle>
              <p className="text-xs text-muted-foreground">mm</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>7d Precipitation</CardDescription>
              <CardTitle className="text-3xl">{floodData.precipitation7d}</CardTitle>
              <p className="text-xs text-muted-foreground">mm</p>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Stats Panel - Temperature Anomaly */}
      {activeLayer === 'temperature' && temperatureData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Temperature</CardDescription>
              <CardTitle className="text-3xl">{temperatureData.currentTemp}°C</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Historical Average</CardDescription>
              <CardTitle className="text-3xl">{temperatureData.historicalAvg}°C</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Anomaly</CardDescription>
              <CardTitle className="text-3xl" style={{ color: temperatureData.color }}>
                {temperatureData.anomaly > 0 ? '+' : ''}{temperatureData.anomaly}°C
              </CardTitle>
              <p className="text-xs text-muted-foreground">{temperatureData.anomalyPercent}%</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Trend</CardDescription>
              <Badge style={{ backgroundColor: temperatureData.color }} className="text-white">
                {temperatureData.trend.toUpperCase().replace('_', ' ')}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">{temperatureData.description}</p>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Stats Panel - Solar Potential */}
      {activeLayer === 'solar' && solarData && solarData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Solar Radiation</CardDescription>
              <CardTitle className="text-3xl">
                {(solarData.reduce((sum: number, p: any) => sum + p.solarRadiation, 0) / solarData.length).toFixed(2)}
              </CardTitle>
              <p className="text-xs text-muted-foreground">kWh/m²/day</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Annual Production</CardDescription>
              <CardTitle className="text-3xl">
                {Math.round(solarData.reduce((sum: number, p: any) => sum + p.annualProduction, 0) / solarData.length).toLocaleString()}
              </CardTitle>
              <p className="text-xs text-muted-foreground">kWh/year (4kW system)</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Capacity Factor</CardDescription>
              <CardTitle className="text-3xl">
                {(solarData.reduce((sum: number, p: any) => sum + p.capacityFactor, 0) / solarData.length).toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Data Points</CardDescription>
              <CardTitle className="text-3xl">{solarData.length}</CardTitle>
              <p className="text-xs text-muted-foreground">NREL PVWatts</p>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Map Container */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Live Climate Map
              </CardTitle>
              <CardDescription>
                Real-time fire data from NASA FIRMS satellite
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {(loadingFires || loadingAir || loadingFlood || loadingTemperature) && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              )}
              <Button 
                onClick={handleRefresh} 
                size="sm" 
                disabled={loading || loadingFires || loadingAir || loadingFlood || loadingTemperature}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapContainer} 
            className="w-full h-[600px] rounded-lg overflow-hidden"
          />
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          {/* Legend - Fires */}
          {activeLayer === 'fires' && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Legend</h4>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white" />
                  <span>High Confidence Fire</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white" />
                  <span>Medium Confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white" />
                  <span>Low Confidence</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Data source:</strong> NASA FIRMS (Fire Information for Resource Management System)
                <br />
                <strong>How it works:</strong> Pan/zoom the map to load fires for any region worldwide
                <br />
                Updated every 15 minutes • Marker size indicates fire intensity (FRP)
                <br />
                {stats && stats.totalFires > 1000 && (
                  <span className="text-yellow-600">⚡ Showing 1000 of {stats.totalFires} fires for performance</span>
                )}
              </p>
            </div>
          )}

          {/* Legend - Solar Potential */}
          {activeLayer === 'solar' && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Legend</h4>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white" />
                  <span>Excellent (&gt;7 kWh/m²/day)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white" />
                  <span>Very Good (6-7 kWh/m²/day)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white" />
                  <span>Good (&lt;6 kWh/m²/day)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Data source:</strong> NREL PVWatts (National Renewable Energy Laboratory)
                <br />
                <strong>How it works:</strong> Shows solar potential for 4kW residential systems
                <br />
                Based on satellite solar radiation data • Click markers for detailed estimates
                {loadingSolar && (
                  <>
                    <br />
                    <span className="text-blue-600">⏳ Loading solar data...</span>
                  </>
                )}
                {solarData && solarData.length > 0 && (
                  <>
                    <br />
                    <span className="text-green-600">✓ Showing {solarData.length} sample points</span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Legend - Air Quality */}
          {activeLayer === 'air' && airQualityData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Air Quality</h4>
              <div className="flex flex-wrap gap-4 text-xs mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00e400' }} />
                  <span>Good (0-50)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ffff00' }} />
                  <span>Moderate (51-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ff7e00' }} />
                  <span>Unhealthy (101-150)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ff0000' }} />
                  <span>Very Unhealthy (151+)</span>
                </div>
              </div>
              <div className="p-3 bg-background rounded border">
                <p className="text-xs font-medium mb-1">Health Recommendation:</p>
                <p className="text-xs text-muted-foreground">{airQualityData.healthRecommendation}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Data source:</strong> OpenWeather Air Pollution API
                <br />
                Updated hourly • Pan map to check different locations
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
