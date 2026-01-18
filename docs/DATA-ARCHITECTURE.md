# Data Architecture Documentation

## Overview

This document describes the data management architecture implemented in the Semana Santa Tracker application. The architecture uses a service-based pattern with repository abstraction, allowing seamless transition from JSON mock data to a REST API backend.

## Architecture Diagram

```
┌─────────────────────┐
│   React Components  │
│  (index.tsx, etc.)  │
└──────────┬──────────┘
           │ uses
           ▼
┌─────────────────────┐
│  useProcessions()   │
│   React Hook        │
└──────────┬──────────┘
           │ consumes
           ▼
┌─────────────────────┐
│   DataService       │
│   (Singleton)       │
└──────────┬──────────┘
           │ uses
           ▼
┌─────────────────────┐
│ IProcessionRepository│
│   (Interface)       │
└──────────┬──────────┘
           │ implemented by
      ┌────┴────┐
      ▼         ▼
┌──────────┐ ┌──────────┐
│   Mock   │ │   API    │
│Repository│ │Repository│
└────┬─────┘ └────┬─────┘
     │            │
     ▼            ▼
┌─────────┐  ┌─────────┐
│  JSON   │  │REST API │
│  Files  │  │(Future) │
└─────────┘  └─────────┘
```

## Core Components

### 1. Types (`/types/data.ts`)

Defines all TypeScript interfaces and types:

- **Base Types**: `Procession`, `Paso`, `RoutePoint`, `AppConfig`
- **DTO Types**: `CreateProcessionDto`, `UpdateProcessionDto`
- **Response Types**: `ProcessionResponse`, `ApiError`
- **Filter Types**: `ProcessionFilters`, `ProcessionQuery`

### 2. Repository Interface (`/services/repositories/IProcessionRepository.ts`)

Defines the contract for data operations:

```typescript
interface IProcessionRepository {
  getAll(filters?: ProcessionFilters): Promise<Procession[]>;
  getById(id: string): Promise<Procession>;
  create(data: CreateProcessionDto): Promise<Procession>;
  update(data: UpdateProcessionDto): Promise<Procession>;
  delete(id: string): Promise<void>;
  getByDay(day: string): Promise<Procession[]>;
  getActive(): Promise<Procession | null>;
  getUniqueDays(): Promise<string[]>;
  getConfig(): Promise<AppConfig>;
}
```

### 3. Repository Implementations

#### MockRepository (`/services/repositories/MockRepository.ts`)

Current implementation using JSON files:
- Reads data from `data/processions.json` and `data/config.json`
- Simulates async behavior with delays
- Maintains in-memory state for CRUD operations
- Mimics API error handling

#### APIRepository (`/services/repositories/APIRepository.ts`)

Future implementation for REST API:
- Ready-to-use skeleton with fetch calls
- Authentication token support
- Error handling and response parsing
- Query string building for filters

### 4. DataService (`/services/data-service.ts`)

Singleton service that:
- Manages the active repository
- Provides caching layer
- Notifies subscribers of data changes
- Exposes clean API for data operations

Key features:
```typescript
// Get processions
await dataService.getProcessions();

// CRUD operations
await dataService.createProcession(data);
await dataService.updateProcession(data);
await dataService.deleteProcession(id);

// Subscribe to changes
const unsubscribe = dataService.subscribe((processions) => {
  console.log('Data updated:', processions);
});
```

### 5. React Hook (`/hooks/use-processions.ts`)

Provides React components with:
- Automatic state management
- Loading and error states
- CRUD operations
- Data filtering
- Auto-refresh on changes

Usage:
```typescript
const {
  processions,
  isLoading,
  error,
  updateProcession,
  refreshProcessions
} = useProcessions();
```

## Data Files

### `/data/processions.json`

Contains the procession data array:
```json
[
  {
    "id": "1",
    "name": "La Borriquita",
    "brotherhood": "...",
    "day": "Domingo de Ramos",
    ...
  }
]
```

### `/data/config.json`

Contains application configuration:
```json
{
  "huelvaCenter": {
    "latitude": 37.2578,
    "longitude": -6.9508
  },
  "brotherhoodColors": [...],
  "darkRouteColors": [...]
}
```

## Migration Path: JSON to API

When your REST API is ready, follow these steps:

### 1. Configure API URL

Add to your `.env` file:
```bash
EXPO_PUBLIC_API_URL=https://your-api.com
```

### 2. Switch Repository

In your app initialization (e.g., `app/_layout.tsx`):

```typescript
import { APIRepository } from '@/services/repositories/APIRepository';
import { dataService } from '@/services/data-service';

// Initialize API repository
const apiRepo = new APIRepository();

// Optional: Set auth token
apiRepo.setAuthToken('your-jwt-token');

// Switch the repository
dataService.setRepository(apiRepo);
```

### 3. No Component Changes Required

All components using `useProcessions()` hook will automatically use the new data source. No changes needed!

## CRUD Operations

### Create a Procession

```typescript
const { createProcession } = useProcessions();

await createProcession({
  name: "Nueva Procesión",
  brotherhood: "Hermandad...",
  day: "Jueves Santo",
  // ... other fields
});
```

### Update a Procession

```typescript
const { updateProcession } = useProcessions();

await updateProcession({
  id: "1",
  status: "in_progress",
  // Only include fields to update
});
```

### Delete a Procession

```typescript
const { deleteProcession } = useProcessions();

await deleteProcession("1");
```

## Caching Strategy

- **DataService** maintains an in-memory cache of processions
- Cache is automatically cleared on mutations (create/update/delete)
- Cache is bypassed when filters are applied
- Manual refresh available via `refreshProcessions()`

## Error Handling

Errors are handled at multiple levels:

1. **Repository Level**: Throws specific errors (e.g., "Procession not found")
2. **Service Level**: Catches and logs errors
3. **Hook Level**: Exposes errors to components via `error` state

Example:
```typescript
const { error, processions } = useProcessions();

if (error) {
  return <ErrorMessage text={error} />;
}
```

## Testing

The architecture is designed for easy testing:

### Mock the Repository

```typescript
class TestRepository implements IProcessionRepository {
  async getAll() {
    return [/* test data */];
  }
  // ... implement other methods
}

dataService.setRepository(new TestRepository());
```

### Mock the Hook

```typescript
jest.mock('@/hooks/use-processions', () => ({
  useProcessions: () => ({
    processions: [/* mock data */],
    isLoading: false,
    error: null,
    // ... mock methods
  })
}));
```

## Best Practices

1. **Always use the hook** in components, never import data directly
2. **Handle loading states** to improve UX
3. **Display errors** to inform users of issues
4. **Use filters** to reduce data transfer when possible
5. **Subscribe to changes** for real-time updates
6. **Clear cache** when external data might have changed

## Future Enhancements

- Add persistence layer (AsyncStorage) for offline support
- Implement optimistic updates for better UX
- Add data validation with Zod or similar
- Implement pagination for large datasets
- Add WebSocket support for real-time updates
- Implement retry logic for failed API calls

## Legacy Code

The old data structure is preserved in `/data/processions.ts` for reference but is **deprecated**. Do not import from this file. It will be removed in a future update.

## Questions?

For questions about this architecture, refer to:
- Repository pattern: https://martinfowler.com/eaaCatalog/repository.html
- React hooks: https://react.dev/reference/react
- Service pattern: https://en.wikipedia.org/wiki/Service_layer_pattern
