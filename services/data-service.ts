/**
 * Data Service - Singleton service for managing procession data
 * Provides a centralized interface for all data operations
 */

import type { 
  Procession, 
  CreateProcessionDto, 
  UpdateProcessionDto,
  ProcessionFilters,
  AppConfig 
} from '@/types/data';
import type { IProcessionRepository } from './repositories/IProcessionRepository';
import { MockRepository } from './repositories/MockRepository';

type DataChangeListener = (processions: Procession[]) => void;

export class DataService {
  private static instance: DataService;
  private repository: IProcessionRepository;
  private listeners: Set<DataChangeListener> = new Set();
  private cache: Procession[] | null = null;
  private configCache: AppConfig | null = null;

  private constructor() {
    // Initialize with MockRepository by default
    // In the future, this can be swapped with APIRepository
    this.repository = new MockRepository();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * Set a different repository implementation
   * Useful for testing or switching to API repository
   */
  setRepository(repository: IProcessionRepository): void {
    this.repository = repository;
    this.clearCache();
  }

  /**
   * Clear the cache (force refresh on next request)
   */
  clearCache(): void {
    this.cache = null;
    this.configCache = null;
  }

  /**
   * Subscribe to data changes
   */
  subscribe(listener: DataChangeListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of data changes
   */
  private notifyListeners(processions: Procession[]): void {
    this.listeners.forEach(listener => listener(processions));
  }

  /**
   * Get all processions with optional filters
   */
  async getProcessions(filters?: ProcessionFilters): Promise<Procession[]> {
    // Use cache if available and no filters
    if (!filters && this.cache) {
      return this.cache;
    }

    const processions = await this.repository.getAll(filters);
    
    // Cache unfiltered results
    if (!filters) {
      this.cache = processions;
    }
    
    return processions;
  }

  /**
   * Get a single procession by ID
   */
  async getProcessionById(id: string): Promise<Procession> {
    return await this.repository.getById(id);
  }

  /**
   * Create a new procession
   */
  async createProcession(data: CreateProcessionDto): Promise<Procession> {
    const newProcession = await this.repository.create(data);
    
    // Clear cache and notify listeners
    this.clearCache();
    const allProcessions = await this.getProcessions();
    this.notifyListeners(allProcessions);
    
    return newProcession;
  }

  /**
   * Update an existing procession
   */
  async updateProcession(data: UpdateProcessionDto): Promise<Procession> {
    const updatedProcession = await this.repository.update(data);
    
    // Update cache if it exists
    if (this.cache) {
      const index = this.cache.findIndex(p => p.id === data.id);
      if (index !== -1) {
        this.cache[index] = updatedProcession;
      }
    }
    
    // Notify listeners
    const allProcessions = await this.getProcessions();
    this.notifyListeners(allProcessions);
    
    return updatedProcession;
  }

  /**
   * Delete a procession
   */
  async deleteProcession(id: string): Promise<void> {
    await this.repository.delete(id);
    
    // Update cache if it exists
    if (this.cache) {
      this.cache = this.cache.filter(p => p.id !== id);
    }
    
    // Notify listeners
    const allProcessions = await this.getProcessions();
    this.notifyListeners(allProcessions);
  }

  /**
   * Get processions for a specific day
   */
  async getProcessionsByDay(day: string): Promise<Procession[]> {
    return await this.repository.getByDay(day);
  }

  /**
   * Get the currently active procession
   */
  async getActiveProcession(): Promise<Procession | null> {
    return await this.repository.getActive();
  }

  /**
   * Get unique days from all processions
   */
  async getUniqueDays(): Promise<string[]> {
    return await this.repository.getUniqueDays();
  }

  /**
   * Get application configuration
   */
  async getConfig(): Promise<AppConfig> {
    if (this.configCache) {
      return this.configCache;
    }
    
    this.configCache = await this.repository.getConfig();
    return this.configCache;
  }

  /**
   * Refresh data from the repository
   */
  async refresh(): Promise<Procession[]> {
    this.clearCache();
    const processions = await this.getProcessions();
    this.notifyListeners(processions);
    return processions;
  }
}

// Export a singleton instance for convenience
export const dataService = DataService.getInstance();
