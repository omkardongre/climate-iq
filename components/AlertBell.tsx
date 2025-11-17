"use client";

import { useState, useEffect } from 'react';
import { Bell, RefreshCw, X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Alert {
  id: string;
  type: 'thermal_anomaly' | 'air_quality' | 'flood_risk' | 'temperature_extreme';
  severity: 'info' | 'advisory' | 'warning' | 'critical' | 'emergency';
  title: string;
  message: string;
  actionItems: string[];
  expiresAt: string;
  seen: boolean;
}

interface AlertResponse {
  success: boolean;
  location: string;
  conditions: {
    temperature: number;
    aqi: number;
    rainfall: number;
    humidity: number;
    windSpeed: number;
  };
  alerts: Omit<Alert, 'id' | 'seen'>[];
  timestamp: string;
}

export function AlertBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [location, setLocation] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Auto-check every 8 hours
  useEffect(() => {
    checkAlerts(); // Initial check

    const interval = setInterval(() => {
      checkAlerts();
    }, 8 * 60 * 60 * 1000); // 8 hours

    return () => clearInterval(interval);
  }, []);

  const checkAlerts = async () => {
    setIsChecking(true);

    try {
      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Call alert checking API
      const response = await fetch('/api/alerts/check-conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude })
      });

      if (!response.ok) {
        throw new Error('Failed to check alerts');
      }

      const data: AlertResponse = await response.json();
      
      // Add IDs and seen status to alerts
      const newAlerts: Alert[] = data.alerts.map((alert, index) => ({
        ...alert,
        id: `${Date.now()}-${index}`,
        seen: false
      }));

      // Merge with existing alerts (keep seen status)
      setAlerts(prev => {
        const merged = [...newAlerts];
        prev.forEach(oldAlert => {
          const exists = merged.find(a => 
            a.type === oldAlert.type && 
            a.severity === oldAlert.severity &&
            a.title === oldAlert.title
          );
          if (exists && oldAlert.seen) {
            exists.seen = true;
          }
        });
        return merged;
      });
      
      setLocation(data.location);

    } catch (error) {
      console.error('Error checking alerts:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const markAsSeen = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, seen: true } : alert
    ));
  };

  const markAllAsSeen = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, seen: true })));
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500';
      case 'advisory': return 'bg-green-500';
      case 'warning': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      case 'emergency': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info': return <Info className="h-4 w-4" />;
      case 'advisory': return <AlertCircle className="h-4 w-4" />;
      case 'warning':
      case 'critical':
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'thermal_anomaly': return '🔥 Thermal Anomaly';
      case 'air_quality': return '💨 Air Quality';
      case 'flood_risk': return '🌊 Flood Risk';
      case 'temperature_extreme': return '🌡️ Temperature Extreme';
      default: return type;
    }
  };

  const unseenCount = alerts.filter(a => !a.seen).length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            markAllAsSeen(); // Mark all as seen when opening
          }
        }}
      >
        <Bell className="h-5 w-5" />
        {unseenCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            variant="destructive"
          >
            {unseenCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Climate Alerts</h3>
                {location && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{location}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkAlerts}
                  disabled={isChecking}
                  title="Refresh alerts"
                >
                  <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Alert List */}
          <div className="max-h-[500px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No active alerts</p>
                <p className="text-xs">Conditions are normal</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {alerts.map((alert) => (
                  <Card key={alert.id} className={`relative ${alert.seen ? 'opacity-60' : ''}`}>
                    <div className={`absolute top-0 left-0 w-1 h-full ${getSeverityColor(alert.severity)}`} />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <CardHeader className="pb-3 pr-8">
                      <div className="flex items-start gap-2">
                        <div className={`p-1 rounded ${getSeverityColor(alert.severity)} text-white`}>
                          {getSeverityIcon(alert.severity)}
                        </div>
                        <div>
                          <CardTitle className="text-sm">
                            {getAlertTypeLabel(alert.type)}
                          </CardTitle>
                          <CardDescription className="text-xs uppercase font-semibold">
                            {alert.severity}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{alert.message}</p>
                      
                      {alert.actionItems.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Actions:</p>
                          <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                            {alert.actionItems.map((action, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-primary">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Expires: {new Date(alert.expiresAt).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
