/**
 * Repository interface for procession data operations
 * This interface defines the contract that all repository implementations must follow
 */

import type { 
  Procession, 
  CreateProcessionDto, 
  UpdateProcessionDto,
  ProcessionFilters,
  AppConfig 
} from '@/types/data';

export interface IProcessionRepository {
  /**
   * Get all processions with optional filters
   */
  getAll(filters?: ProcessionFilters): Promise<Procession[]>;

  /**
   * Get a single procession by ID
   * @throws Error if procession not found
   */
  getById(id: string): Promise<Procession>;

  /**
   * Create a new procession
   * @returns The created procession with generated ID
   */
  create(data: CreateProcessionDto): Promise<Procession>;

  /**
   * Update an existing procession
   * @throws Error if procession not found
   */
  update(data: UpdateProcessionDto): Promise<Procession>;

  /**
   * Delete a procession by ID
   * @throws Error if procession not found
   */
  delete(id: string): Promise<void>;

  /**
   * Get processions for a specific day
   */
  getByDay(day: string): Promise<Procession[]>;

  /**
   * Get the currently active procession (status === 'in_progress')
   */
  getActive(): Promise<Procession | null>;

  /**
   * Get unique days from all processions
   */
  getUniqueDays(): Promise<string[]>;

  /**
   * Get application configuration
   */
  getConfig(): Promise<AppConfig>;
}
