/**
 * Mock repository implementation using JSON files
 * Simulates API behavior with async operations and error handling
 */

import type { 
  Procession, 
  CreateProcessionDto, 
  UpdateProcessionDto,
  ProcessionFilters,
  AppConfig 
} from '@/types/data';
import type { IProcessionRepository } from './IProcessionRepository';

// Import JSON data
import processionsData from '@/data/processions.json';
import configData from '@/data/config.json';

export class MockRepository implements IProcessionRepository {
  private processions: Procession[];
  private config: AppConfig;

  constructor() {
    // Load data from JSON files
    this.processions = processionsData as Procession[];
    this.config = configData as AppConfig;
  }

  /**
   * Simulate network delay for realistic behavior
   */
  private async delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a unique ID for new processions
   */
  private generateId(): string {
    const maxId = this.processions.reduce((max, p) => {
      const id = parseInt(p.id, 10);
      return id > max ? id : max;
    }, 0);
    return String(maxId + 1);
  }

  async getAll(filters?: ProcessionFilters): Promise<Procession[]> {
    await this.delay();
    
    let result = [...this.processions];

    if (filters) {
      if (filters.day) {
        result = result.filter(p => p.day === filters.day);
      }
      if (filters.status) {
        result = result.filter(p => p.status === filters.status);
      }
      if (filters.brotherhood) {
        result = result.filter(p => 
          p.brotherhood.toLowerCase().includes(filters.brotherhood!.toLowerCase())
        );
      }
    }

    return result;
  }

  async getById(id: string): Promise<Procession> {
    await this.delay();
    
    const procession = this.processions.find(p => p.id === id);
    
    if (!procession) {
      throw new Error(`Procession with id ${id} not found`);
    }
    
    return { ...procession };
  }

  async create(data: CreateProcessionDto): Promise<Procession> {
    await this.delay(150);
    
    const newProcession: Procession = {
      ...data,
      id: this.generateId(),
      status: data.status || 'not_started',
      pasos: data.pasos.map((paso, index) => ({
        ...paso,
        id: `paso-${index + 1}`,
      })),
    };
    
    this.processions.push(newProcession);
    
    return { ...newProcession };
  }

  async update(data: UpdateProcessionDto): Promise<Procession> {
    await this.delay(150);
    
    const index = this.processions.findIndex(p => p.id === data.id);
    
    if (index === -1) {
      throw new Error(`Procession with id ${data.id} not found`);
    }
    
    // Merge the updates with existing data
    const updatedProcession: Procession = {
      ...this.processions[index],
      ...data,
    };
    
    this.processions[index] = updatedProcession;
    
    return { ...updatedProcession };
  }

  async delete(id: string): Promise<void> {
    await this.delay(100);
    
    const index = this.processions.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error(`Procession with id ${id} not found`);
    }
    
    this.processions.splice(index, 1);
  }

  async getByDay(day: string): Promise<Procession[]> {
    await this.delay();
    
    return this.processions.filter(p => p.day === day);
  }

  async getActive(): Promise<Procession | null> {
    await this.delay();
    
    const active = this.processions.find(p => p.status === 'in_progress');
    
    return active ? { ...active } : null;
  }

  async getUniqueDays(): Promise<string[]> {
    await this.delay();
    
    const days = this.processions.map(p => p.day);
    return Array.from(new Set(days));
  }

  async getConfig(): Promise<AppConfig> {
    await this.delay(50);
    
    return { ...this.config };
  }
}
