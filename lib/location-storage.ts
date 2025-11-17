// Location storage utility for browser localStorage
export interface StoredLocation {
  name: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  timestamp: number;
}

const LOCATION_STORAGE_KEY = "climateIQ-user-location";

export function saveLocation(location: StoredLocation): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch (error) {
    console.error("Failed to save location to localStorage:", error);
  }
}

export function getStoredLocation(): StoredLocation | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!stored) return null;

    const location = JSON.parse(stored) as StoredLocation;

    // Check if location is older than 24 hours
    const isStale = Date.now() - location.timestamp > 24 * 60 * 60 * 1000;
    if (isStale) {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
      return null;
    }

    return location;
  } catch (error) {
    console.error("Failed to retrieve location from localStorage:", error);
    return null;
  }
}

export function clearStoredLocation(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear location from localStorage:", error);
  }
}

export function getLocationForChat(): string {
  const stored = getStoredLocation();
  return stored?.name || "New York, NY";
}
