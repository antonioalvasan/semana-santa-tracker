/**
 * React hook for managing procession data
 * Provides a clean interface for components to access and manipulate procession data
 */

import { useState, useEffect, useCallback } from 'react';
import { dataService } from '@/services/data-service';
import type { 
  Procession, 
  CreateProcessionDto, 
  UpdateProcessionDto,
  ProcessionFilters,
  AppConfig 
} from '@/types/data';

interface UseProcessionsResult {
  processions: Procession[];
  isLoading: boolean;
  error: string | null;
  refreshProcessions: () => Promise<void>;
  getProcessionById: (id: string) => Promise<Procession | undefined>;
  createProcession: (data: CreateProcessionDto) => Promise<Procession | null>;
  updateProcession: (data: UpdateProcessionDto) => Promise<Procession | null>;
  deleteProcession: (id: string) => Promise<boolean>;
  getProcessionsByDay: (day: string) => Procession[];
  getActiveProcession: () => Procession | undefined;
  getUniqueDays: () => string[];
}

/**
 * Hook to manage processions data
 * @param filters Optional filters to apply to the processions list
 * @param autoRefresh Whether to automatically refresh data when it changes (default: true)
 */
export function useProcessions(
  filters?: ProcessionFilters,
  autoRefresh: boolean = true
): UseProcessionsResult {
  const [processions, setProcessions] = useState<Procession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load processions
  const loadProcessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataService.getProcessions(filters);
      setProcessions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load processions';
      setError(errorMessage);
      console.error('Error loading processions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    loadProcessions();
  }, [loadProcessions]);

  // Subscribe to data changes
  useEffect(() => {
    if (!autoRefresh) return;

    const unsubscribe = dataService.subscribe((updatedProcessions) => {
      setProcessions(updatedProcessions);
    });

    return unsubscribe;
  }, [autoRefresh]);

  // Refresh processions manually
  const refreshProcessions = useCallback(async () => {
    await loadProcessions();
  }, [loadProcessions]);

  // Get a single procession by ID
  const getProcessionById = useCallback(async (id: string): Promise<Procession | undefined> => {
    try {
      return await dataService.getProcessionById(id);
    } catch (err) {
      console.error('Error getting procession by ID:', err);
      return undefined;
    }
  }, []);

  // Create a new procession
  const createProcession = useCallback(async (data: CreateProcessionDto): Promise<Procession | null> => {
    try {
      setError(null);
      const newProcession = await dataService.createProcession(data);
      return newProcession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create procession';
      setError(errorMessage);
      console.error('Error creating procession:', err);
      return null;
    }
  }, []);

  // Update an existing procession
  const updateProcession = useCallback(async (data: UpdateProcessionDto): Promise<Procession | null> => {
    try {
      setError(null);
      const updatedProcession = await dataService.updateProcession(data);
      return updatedProcession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update procession';
      setError(errorMessage);
      console.error('Error updating procession:', err);
      return null;
    }
  }, []);

  // Delete a procession
  const deleteProcession = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await dataService.deleteProcession(id);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete procession';
      setError(errorMessage);
      console.error('Error deleting procession:', err);
      return false;
    }
  }, []);

  // Get processions for a specific day (from current data)
  const getProcessionsByDay = useCallback((day: string): Procession[] => {
    return processions.filter(p => p.day === day);
  }, [processions]);

  // Get the currently active procession (from current data)
  const getActiveProcession = useCallback((): Procession | undefined => {
    return processions.find(p => p.status === 'in_progress');
  }, [processions]);

  // Get unique days (from current data)
  const getUniqueDays = useCallback((): string[] => {
    const days = processions.map(p => p.day);
    return Array.from(new Set(days));
  }, [processions]);

  return {
    processions,
    isLoading,
    error,
    refreshProcessions,
    getProcessionById,
    createProcession,
    updateProcession,
    deleteProcession,
    getProcessionsByDay,
    getActiveProcession,
    getUniqueDays,
  };
}

/**
 * Hook to get application configuration
 */
export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const configData = await dataService.getConfig();
        setConfig(configData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load config';
        setError(errorMessage);
        console.error('Error loading config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, isLoading, error };
}
