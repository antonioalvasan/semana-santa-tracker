import { useEffect, useState } from 'react';

import { getProcessionRoute, formatDistance, formatDuration, type Coordinate, type RouteResult } from '@/services/routing';
import type { Procession } from '@/data/processions';

interface UseProcessionRouteResult {
  routeCoordinates: Coordinate[];
  distance: string;
  duration: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that fetches the real street-following route for a procession
 * Uses OSRM to calculate the actual walking path through streets
 */
export function useProcessionRoute(procession: Procession): UseProcessionRouteResult {
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoute() {
      setIsLoading(true);
      setError(null);

      try {
        // Extract waypoints from the procession route
        const waypoints: Coordinate[] = procession.route.map(point => ({
          latitude: point.latitude,
          longitude: point.longitude,
        }));

        // Fetch the real street-following route from OSRM
        const result: RouteResult = await getProcessionRoute(waypoints);

        setRouteCoordinates(result.coordinates);
        setDistance(formatDistance(result.distance));
        setDuration(formatDuration(result.duration));
      } catch (err) {
        console.error('Failed to fetch procession route:', err);
        setError(err instanceof Error ? err.message : 'Failed to load route');
        
        // Fallback to original coordinates if OSRM fails
        setRouteCoordinates(
          procession.route.map(point => ({
            latitude: point.latitude,
            longitude: point.longitude,
          }))
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoute();
  }, [procession.id]);

  return {
    routeCoordinates,
    distance,
    duration,
    isLoading,
    error,
  };
}

