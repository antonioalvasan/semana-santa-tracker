/**
 * API Repository implementation for production use
 * This is a skeleton ready to be implemented when the REST API is available
 */

import type { 
  Procession, 
  CreateProcessionDto, 
  UpdateProcessionDto,
  ProcessionFilters,
  AppConfig,
  ProcessionResponse,
  SingleProcessionResponse,
  ApiError
} from '@/types/data';
import type { IProcessionRepository } from './IProcessionRepository';

// TODO: Configure your API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com';

export class APIRepository implements IProcessionRepository {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null;
  }

  /**
   * Build headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Handle API errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If parsing error response fails, use default message
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /**
   * Build query string from filters
   */
  private buildQueryString(filters?: ProcessionFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();
    
    if (filters.day) params.append('day', filters.day);
    if (filters.status) params.append('status', filters.status);
    if (filters.brotherhood) params.append('brotherhood', filters.brotherhood);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  async getAll(filters?: ProcessionFilters): Promise<Procession[]> {
    // TODO: Implement API call
    const queryString = this.buildQueryString(filters);
    const response = await fetch(
      `${this.baseUrl}/processions${queryString}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    const data = await this.handleResponse<ProcessionResponse>(response);
    return data.data;
  }

  async getById(id: string): Promise<Procession> {
    // TODO: Implement API call
    const response = await fetch(
      `${this.baseUrl}/processions/${id}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    const data = await this.handleResponse<SingleProcessionResponse>(response);
    return data.data;
  }

  async create(data: CreateProcessionDto): Promise<Procession> {
    // TODO: Implement API call
    const response = await fetch(
      `${this.baseUrl}/processions`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      }
    );

    const result = await this.handleResponse<SingleProcessionResponse>(response);
    return result.data;
  }

  async update(data: UpdateProcessionDto): Promise<Procession> {
    // TODO: Implement API call
    const response = await fetch(
      `${this.baseUrl}/processions/${data.id}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      }
    );

    const result = await this.handleResponse<SingleProcessionResponse>(response);
    return result.data;
  }

  async delete(id: string): Promise<void> {
    // TODO: Implement API call
    const response = await fetch(
      `${this.baseUrl}/processions/${id}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );

    await this.handleResponse<void>(response);
  }

  async getByDay(day: string): Promise<Procession[]> {
    // TODO: Implement API call
    return this.getAll({ day });
  }

  async getActive(): Promise<Procession | null> {
    // TODO: Implement API call
    const processions = await this.getAll({ status: 'in_progress' });
    return processions.length > 0 ? processions[0] : null;
  }

  async getUniqueDays(): Promise<string[]> {
    // TODO: Implement API call
    const response = await fetch(
      `${this.baseUrl}/processions/days`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    const data = await this.handleResponse<{ data: string[] }>(response);
    return data.data;
  }

  async getConfig(): Promise<AppConfig> {
    // TODO: Implement API call
    const response = await fetch(
      `${this.baseUrl}/config`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    const data = await this.handleResponse<{ data: AppConfig }>(response);
    return data.data;
  }
}

/**
 * Example usage:
 * 
 * import { APIRepository } from '@/services/repositories/APIRepository';
 * import { dataService } from '@/services/data-service';
 * 
 * // Switch to API repository when ready
 * const apiRepo = new APIRepository('https://your-api.com');
 * apiRepo.setAuthToken('your-jwt-token');
 * dataService.setRepository(apiRepo);
 */
