# Quick Start Guide - New Data Architecture

## Using Processions Data in Components

### Basic Usage

```typescript
import { useProcessions } from '@/hooks/use-processions';

function MyComponent() {
  const { processions, isLoading, error } = useProcessions();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <FlatList
      data={processions}
      renderItem={({ item }) => <ProcessionCard procession={item} />}
    />
  );
}
```

### Get Active Procession

```typescript
const { getActiveProcession } = useProcessions();
const active = getActiveProcession();
```

### Filter by Day

```typescript
const { getProcessionsByDay } = useProcessions();
const sundayProcessions = getProcessionsByDay('Domingo de Ramos');
```

### Get Configuration

```typescript
import { useConfig } from '@/hooks/use-processions';

function MapComponent() {
  const { config } = useConfig();
  
  return (
    <Map
      center={config?.huelvaCenter}
      colors={config?.brotherhoodColors}
    />
  );
}
```

## CRUD Operations

### Update a Procession

```typescript
const { updateProcession } = useProcessions();

const handleStatusChange = async (id: string) => {
  const result = await updateProcession({
    id,
    status: 'in_progress'
  });
  
  if (result) {
    console.log('Updated successfully');
  }
};
```

### Create a Procession

```typescript
const { createProcession } = useProcessions();

const handleCreate = async () => {
  const newProcession = await createProcession({
    name: "Nueva Procesión",
    brotherhood: "Hermandad...",
    day: "Jueves Santo",
    departureTime: "19:00",
    returnTime: "02:00",
    parish: "Parroquia...",
    cruzDeGuia: { latitude: 37.25, longitude: -6.95 },
    pasos: [],
    carreraOficial: {
      start: { latitude: 37.25, longitude: -6.95 },
      end: { latitude: 37.26, longitude: -6.94 }
    },
    route: [],
    description: "..."
  });
};
```

### Delete a Procession

```typescript
const { deleteProcession } = useProcessions();

const handleDelete = async (id: string) => {
  const success = await deleteProcession(id);
  
  if (success) {
    console.log('Deleted successfully');
  }
};
```

## Switching to REST API (Future)

When your API is ready, add to `app/_layout.tsx`:

```typescript
import { APIRepository } from '@/services/repositories';
import { dataService } from '@/services/data-service';

// Inside your root layout component
useEffect(() => {
  const apiRepo = new APIRepository(process.env.EXPO_PUBLIC_API_URL);
  
  // Optional: Set auth token
  apiRepo.setAuthToken('your-jwt-token');
  
  // Switch repository
  dataService.setRepository(apiRepo);
}, []);
```

That's it! No component changes needed.

## File Structure

```
/types
  data.ts                    # All TypeScript types

/data
  processions.json          # Procession data
  config.json               # App configuration
  processions.ts            # DEPRECATED - don't use

/services
  data-service.ts           # Main service (singleton)
  /repositories
    IProcessionRepository.ts    # Interface
    MockRepository.ts           # JSON implementation (current)
    APIRepository.ts            # API implementation (future)
    index.ts                    # Exports

/hooks
  use-processions.ts        # Main React hook
```

## Common Patterns

### Loading State

```typescript
const { isLoading } = useProcessions();

if (isLoading) {
  return <LoadingScreen />;
}
```

### Error Handling

```typescript
const { error } = useProcessions();

if (error) {
  return <ErrorAlert message={error} />;
}
```

### Manual Refresh

```typescript
const { refreshProcessions } = useProcessions();

<RefreshControl
  refreshing={isLoading}
  onRefresh={refreshProcessions}
/>
```

### Filtered Data

```typescript
// Option 1: Filter with hook
const { processions } = useProcessions({ day: 'Domingo de Ramos' });

// Option 2: Filter in component
const { getProcessionsByDay } = useProcessions();
const filtered = getProcessionsByDay('Domingo de Ramos');
```

## Tips

✅ **Do:**
- Always handle loading and error states
- Use the hook in components
- Check for null/undefined with optional chaining
- Use TypeScript types from `/types/data.ts`

❌ **Don't:**
- Import directly from `/data/processions.ts`
- Access data synchronously
- Forget to handle loading states
- Modify procession objects directly (immutable)

## More Information

- 📖 [Complete Architecture Documentation](./DATA-ARCHITECTURE.md)
- 🔄 [Migration Guide](./MIGRATION-GUIDE.md)
- 🗺️ [OSRM Integration](./OSRM-INTEGRATION.md)
