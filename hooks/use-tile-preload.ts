import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { type PreloadProgress } from '@/services/tile-preloader';

const PRELOAD_STATUS_KEY = '@SemanaSanta:tilesPreloaded';

interface UseTilePreloadResult {
  progress: PreloadProgress | null;
  isPreloaded: boolean;
  isFirstLoad: boolean;
  handleProgress: (progress: PreloadProgress) => void;
  resetPreloadStatus: () => Promise<void>;
}

/**
 * Hook to manage tile preload state across app sessions
 * Tracks whether tiles have been preloaded and stores status in AsyncStorage
 */
export function useTilePreload(): UseTilePreloadResult {
  const [progress, setProgress] = useState<PreloadProgress | null>(null);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Check if tiles were previously preloaded
  useEffect(() => {
    async function checkPreloadStatus() {
      try {
        const status = await AsyncStorage.getItem(PRELOAD_STATUS_KEY);
        if (status === 'true') {
          setIsPreloaded(true);
          setIsFirstLoad(false);
        }
      } catch (error) {
        console.warn('[useTilePreload] Failed to check preload status:', error);
      }
    }
    
    checkPreloadStatus();
  }, []);

  // Handle progress updates from the map
  const handleProgress = useCallback(async (newProgress: PreloadProgress) => {
    setProgress(newProgress);
    
    // Mark as preloaded when complete
    if (newProgress.isComplete && newProgress.percentage >= 90) {
      try {
        await AsyncStorage.setItem(PRELOAD_STATUS_KEY, 'true');
        setIsPreloaded(true);
        setIsFirstLoad(false);
      } catch (error) {
        console.warn('[useTilePreload] Failed to save preload status:', error);
      }
    }
  }, []);

  // Reset preload status (useful for testing or forcing re-download)
  const resetPreloadStatus = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PRELOAD_STATUS_KEY);
      setIsPreloaded(false);
      setIsFirstLoad(true);
      setProgress(null);
    } catch (error) {
      console.warn('[useTilePreload] Failed to reset preload status:', error);
    }
  }, []);

  return {
    progress,
    isPreloaded,
    isFirstLoad,
    handleProgress,
    resetPreloadStatus,
  };
}
