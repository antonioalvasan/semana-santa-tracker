/**
 * OSRM Routing Service
 * Uses the free OSRM public API to calculate routes that follow real streets
 * 
 * API Documentation: http://project-osrm.org/docs/v5.24.0/api/
 */

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  coordinates: Coordinate[];
  distance: number; // in meters
  duration: number; // in seconds
}

// OSRM public demo server - for production use your own instance
const OSRM_BASE_URL = 'https://router.project-osrm.org';

/**
 * Fetches a walking route from OSRM that follows real streets
 * 
 * @param waypoints - Array of coordinates (at least 2 points: start and end)
 * @returns Route coordinates that follow streets, plus distance/duration
 */
export async function getRoute(waypoints: Coordinate[]): Promise<RouteResult> {
  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints are required');
  }

  // OSRM expects coordinates as longitude,latitude (reversed from our format)
  const coordinatesString = waypoints
    .map(wp => `${wp.longitude},${wp.latitude}`)
    .join(';');

  // Use 'foot' profile for walking routes (processions walk)
  // geometries=geojson returns the route as GeoJSON coordinates
  // overview=full returns the complete route geometry
  const url = `${OSRM_BASE_URL}/route/v1/foot/${coordinatesString}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM routing failed: ${data.code || 'No routes found'}`);
    }

    const route = data.routes[0];
    
    // Convert GeoJSON coordinates [lng, lat] to our format {latitude, longitude}
    const coordinates: Coordinate[] = route.geometry.coordinates.map(
      (coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      })
    );

    return {
      coordinates,
      distance: route.distance, // meters
      duration: route.duration, // seconds
    };
  } catch (error) {
    console.error('OSRM routing error:', error);
    throw error;
  }
}

/**
 * Fetches a route through multiple waypoints (for procession routes)
 * The route will pass through all waypoints in order, following streets
 * 
 * @param waypoints - Key points the route must pass through
 * @returns Complete route following streets through all waypoints
 */
export async function getProcessionRoute(waypoints: Coordinate[]): Promise<RouteResult> {
  return getRoute(waypoints);
}

/**
 * Formats distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formats duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

