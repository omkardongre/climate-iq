"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, Search, LocateFixed } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Alert, AlertDescription } from './alert';

interface LocationData {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

interface LocationDetectorProps {
  onLocationChange: (location: LocationData) => void;
  skipInitialDefault?: boolean;
}

export default function LocationDetector({ onLocationChange, skipInitialDefault = false }: LocationDetectorProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const onLocationChangeRef = useRef(onLocationChange);

  // Update ref when callback changes
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  // Safe callback wrapper
  const safeOnLocationChange = useCallback((location: LocationData) => {
    if (onLocationChangeRef.current && typeof onLocationChangeRef.current === 'function') {
      onLocationChangeRef.current(location);
    } else {
      console.error('LocationDetector: onLocationChange is not a function');
    }
  }, []);

  // Default location - Mumbai, India
  const defaultLocation: LocationData = {
    city: 'Mumbai',
    country: 'India',
    lat: 19.0760,
    lon: 72.8777
  };

  // Initialize with default location ONLY ONCE (unless skipped)
  useEffect(() => {
    if (!hasInitialized.current && !skipInitialDefault) {
      console.log('LocationDetector: Initializing with default location (Mumbai)');
      safeOnLocationChange(defaultLocation);
      hasInitialized.current = true;
    }
  }, [safeOnLocationChange, skipInitialDefault]); // Include dependencies

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);
    setError(null);
    console.log('LocationDetector: Starting geolocation detection...');

    const timeoutId = setTimeout(() => {
      setError('Location detection timed out. Using default location.');
      setIsDetecting(false);
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        console.log('LocationDetector: Got coordinates:', position.coords);
        
        try {
          // Use our API route instead of direct API call
          const response = await fetch(
            `/api/weather?action=reverse&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.name) {
              const location: LocationData = {
                city: data.name,
                country: data.country || 'Unknown',
                lat: position.coords.latitude,
                lon: position.coords.longitude
              };
              console.log('LocationDetector: Detected location:', location);
              safeOnLocationChange(location);
            } else {
              throw new Error('No location data found');
            }
          } else {
            throw new Error('Failed to get location name');
          }
        } catch (err) {
          console.error('LocationDetector: Error getting location name:', err);
          setError('Could not get location name. Using coordinates.');
          safeOnLocationChange({
            city: `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`,
            country: 'Unknown',
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        }
        
        setIsDetecting(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('LocationDetector: Geolocation error:', error);
        setError(`Location detection failed: ${error.message}`);
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsDetecting(true);
    setError(null);
    console.log('LocationDetector: Searching for city:', searchQuery);

    try {
      // Use our API route instead of direct API call
      const response = await fetch(
        `/api/weather?action=search&q=${encodeURIComponent(searchQuery)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const location: LocationData = {
            city: data[0].name,
            country: data[0].country,
            lat: data[0].lat,
            lon: data[0].lon
          };
          console.log('LocationDetector: Found city:', location);
          safeOnLocationChange(location);
          setShowSearch(false);
          setSearchQuery('');
        } else {
          throw new Error('City not found');
        }
      } else {
        throw new Error('Search failed');
      }
    } catch (err) {
      console.error('LocationDetector: Search error:', err);
      setError('Could not find the specified city. Please try again.');
    }

    setIsDetecting(false);
  }, [searchQuery]);

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => setShowSearch(!showSearch)}
          disabled={isDetecting}
        >
          <Search className="h-4 w-4 mr-2" />
          {showSearch ? 'Hide Search' : 'Search Different City'}
        </Button>
        
        <Button
          variant="outline"
          onClick={detectLocation}
          disabled={isDetecting}
        >
          {isDetecting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4 mr-2" />
          )}
          Detect My Location
        </Button>
      </div>

      {showSearch && (
        <form onSubmit={handleSearch} className="flex w-full max-w-sm space-x-2">
          <Input
            type="text"
            placeholder="Enter city name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isDetecting || !searchQuery.trim()}>
            {isDetecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>
      )}

      {error && (
        <Alert className="w-full max-w-md">
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
