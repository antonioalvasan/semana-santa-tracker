/**
 * Core data types for Semana Santa Tracker
 * These types define the structure of procession data and related entities
 */

// Base data types
export interface RoutePoint {
  latitude: number;
  longitude: number;
  name: string;
}

export interface Paso {
  id: string;
  name: string;
  type: 'cristo' | 'virgen';
  currentPosition: {
    latitude: number;
    longitude: number;
  };
}

export interface Procession {
  id: string;
  name: string;
  brotherhood: string;
  day: string;
  departureTime: string;
  returnTime: string;
  parish: string;
  cruzDeGuia: {
    latitude: number;
    longitude: number;
  };
  pasos: Paso[];
  carreraOficial: {
    start: { latitude: number; longitude: number };
    end: { latitude: number; longitude: number };
  };
  route: RoutePoint[];
  status: 'not_started' | 'in_progress' | 'returning' | 'finished';
  description: string;
}

// Configuration types
export interface AppConfig {
  huelvaCenter: {
    latitude: number;
    longitude: number;
  };
  brotherhoodColors: string[];
  darkRouteColors: string[];
}

// DTO types for CRUD operations
export interface CreateProcessionDto {
  name: string;
  brotherhood: string;
  day: string;
  departureTime: string;
  returnTime: string;
  parish: string;
  cruzDeGuia: {
    latitude: number;
    longitude: number;
  };
  pasos: Omit<Paso, 'id'>[];
  carreraOficial: {
    start: { latitude: number; longitude: number };
    end: { latitude: number; longitude: number };
  };
  route: RoutePoint[];
  status?: 'not_started' | 'in_progress' | 'returning' | 'finished';
  description: string;
}

export interface UpdateProcessionDto {
  id: string;
  name?: string;
  brotherhood?: string;
  day?: string;
  departureTime?: string;
  returnTime?: string;
  parish?: string;
  cruzDeGuia?: {
    latitude: number;
    longitude: number;
  };
  pasos?: Paso[];
  carreraOficial?: {
    start: { latitude: number; longitude: number };
    end: { latitude: number; longitude: number };
  };
  route?: RoutePoint[];
  status?: 'not_started' | 'in_progress' | 'returning' | 'finished';
  description?: string;
}

// Response types
export interface ProcessionResponse {
  data: Procession[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface SingleProcessionResponse {
  data: Procession;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Filter and query types
export interface ProcessionFilters {
  day?: string;
  status?: Procession['status'];
  brotherhood?: string;
}

export interface ProcessionQuery extends ProcessionFilters {
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'day' | 'departureTime';
  sortOrder?: 'asc' | 'desc';
}
