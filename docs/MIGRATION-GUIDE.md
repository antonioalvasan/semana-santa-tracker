# Migration Guide: Old Data Structure to New Architecture

This guide explains the changes from the old hardcoded data structure to the new service-based architecture.

## What Changed?

### Before (Old Structure)

```typescript
// Direct import of data
import { MOCK_PROCESSIONS, getActiveProcession } from '@/data/processions';

// Usage in component
const processions = MOCK_PROCESSIONS;
const active = getActiveProcession();
```

### After (New Structure)

```typescript
// Use the hook
import { useProcessions } from '@/hooks/use-processions';

// Usage in component
const { processions, getActiveProcession } = useProcessions();
const active = getActiveProcession();
```

## Breaking Changes

### 1. Imports

**Old:**
```typescript
import { MOCK_PROCESSIONS, type Procession } from '@/data/processions';
```

**New:**
```typescript
import type { Procession } from '@/types/data';
import { useProcessions } from '@/hooks/use-processions';
```

### 2. Data Access

**Old (Synchronous):**
```typescript
const processions = MOCK_PROCESSIONS;
const byDay = getProcessionsByDay('Domingo de Ramos');
```

**New (Asynchronous):**
```typescript
const { 
  processions, 
  isLoading, 
  getProcessionsByDay 
} = useProcessions();

// In component body
const byDay = getProcessionsByDay('Domingo de Ramos');
```

### 3. Constants

**Old:**
```typescript
import { HUELVA_CENTER } from '@/data/processions';
```

**New:**
```typescript
import { useConfig } from '@/hooks/use-processions';

const { config } = useConfig();
const center = config?.huelvaCenter;
```

## Component Migration Examples

### Example 1: Simple List Component

**Before:**
```typescript
import { MOCK_PROCESSIONS } from '@/data/processions';

function ProcessionList() {
  return (
    <View>
      {MOCK_PROCESSIONS.map(p => (
        <Text key={p.id}>{p.name}</Text>
      ))}
    </View>
  );
}
```

**After:**
```typescript
import { useProcessions } from '@/hooks/use-processions';

function ProcessionList() {
  const { processions, isLoading } = useProcessions();
  
  if (isLoading) {
    return <ActivityIndicator />;
  }
  
  return (
    <View>
      {processions.map(p => (
        <Text key={p.id}>{p.name}</Text>
      ))}
    </View>
  );
}
```

### Example 2: Filtered View

**Before:**
```typescript
import { MOCK_PROCESSIONS } from '@/data/processions';

function SundayProcessions() {
  const sunday = MOCK_PROCESSIONS.filter(p => p.day === 'Domingo de Ramos');
  
  return (
    <View>
      {sunday.map(p => <ProcessionCard key={p.id} data={p} />)}
    </View>
  );
}
```

**After:**
```typescript
import { useProcessions } from '@/hooks/use-processions';

function SundayProcessions() {
  const { getProcessionsByDay, isLoading } = useProcessions();
  const sunday = getProcessionsByDay('Domingo de Ramos');
  
  if (isLoading) {
    return <ActivityIndicator />;
  }
  
  return (
    <View>
      {sunday.map(p => <ProcessionCard key={p.id} data={p} />)}
    </View>
  );
}
```

### Example 3: Active Procession

**Before:**
```typescript
import { getActiveProcession } from '@/data/processions';

function ActiveProcessionBanner() {
  const active = getActiveProcession();
  
  if (!active) return null;
  
  return <Banner procession={active} />;
}
```

**After:**
```typescript
import { useProcessions } from '@/hooks/use-processions';

function ActiveProcessionBanner() {
  const { getActiveProcession, isLoading } = useProcessions();
  const active = getActiveProcession();
  
  if (isLoading) return <ActivityIndicator size="small" />;
  if (!active) return null;
  
  return <Banner procession={active} />;
}
```

## New Capabilities

The new architecture enables features that weren't possible before:

### 1. CRUD Operations

```typescript
const { 
  createProcession, 
  updateProcession, 
  deleteProcession 
} = useProcessions();

// Create
await createProcession({
  name: "Nueva Procesión",
  brotherhood: "Hermandad del Santo",
  day: "Viernes Santo",
  // ... other fields
});

// Update
await updateProcession({
  id: "1",
  status: "in_progress"
});

// Delete
await deleteProcession("1");
```

### 2. Real-time Updates

```typescript
// Components automatically re-render when data changes
const { processions } = useProcessions();

// In another component or service:
await dataService.updateProcession({ id: "1", status: "finished" });
// All components using useProcessions() will update automatically
```

### 3. Error Handling

```typescript
const { processions, error, isLoading } = useProcessions();

if (error) {
  return <ErrorMessage message={error} />;
}

if (isLoading) {
  return <LoadingSpinner />;
}

return <ProcessionList data={processions} />;
```

### 4. Manual Refresh

```typescript
const { refreshProcessions } = useProcessions();

function RefreshButton() {
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProcessions();
    setRefreshing(false);
  };
  
  return (
    <Button onPress={handleRefresh} disabled={refreshing}>
      Refresh
    </Button>
  );
}
```

## Files Changed

### New Files Created
- `/types/data.ts` - TypeScript type definitions
- `/data/processions.json` - JSON data file
- `/data/config.json` - Configuration data
- `/services/data-service.ts` - Main data service
- `/services/repositories/IProcessionRepository.ts` - Repository interface
- `/services/repositories/MockRepository.ts` - JSON implementation
- `/services/repositories/APIRepository.ts` - API implementation skeleton
- `/hooks/use-processions.ts` - React hook
- `/docs/DATA-ARCHITECTURE.md` - Architecture documentation
- `/docs/MIGRATION-GUIDE.md` - This file

### Files Modified
- `/app/(tabs)/index.tsx` - Updated to use hook
- `/app/(tabs)/calendario.tsx` - Updated to use hook

### Files Deprecated
- `/data/processions.ts` - Still exists for reference, but don't use it

## Common Pitfalls

### 1. Forgetting to Handle Loading State

❌ **Wrong:**
```typescript
const { processions } = useProcessions();
return <List data={processions} />; // processions might be empty during load
```

✅ **Correct:**
```typescript
const { processions, isLoading } = useProcessions();
if (isLoading) return <Spinner />;
return <List data={processions} />;
```

### 2. Importing from Old Files

❌ **Wrong:**
```typescript
import { MOCK_PROCESSIONS } from '@/data/processions';
```

✅ **Correct:**
```typescript
import { useProcessions } from '@/hooks/use-processions';
```

### 3. Not Using Optional Chaining

❌ **Wrong:**
```typescript
const { config } = useConfig();
const center = config.huelvaCenter; // Might crash if config is null
```

✅ **Correct:**
```typescript
const { config } = useConfig();
const center = config?.huelvaCenter;
```

## Testing Your Migration

1. **Check imports**: Search for `@/data/processions` imports
2. **Test loading states**: Temporarily slow down the mock repository
3. **Test error states**: Temporarily throw errors in the repository
4. **Verify CRUD operations**: Try creating/updating/deleting processions
5. **Check TypeScript**: Run `npm run lint` to verify types

## Need Help?

- Read the [Data Architecture Documentation](./DATA-ARCHITECTURE.md)
- Check the [OSRM Integration Guide](./OSRM-INTEGRATION.md)
- Review updated component files for examples

## Timeline

- **Phase 1** (Current): JSON mock data with full CRUD
- **Phase 2** (Future): Switch to REST API (no component changes needed!)
- **Phase 3** (Future): Add offline support with AsyncStorage
- **Phase 4** (Future): Real-time updates via WebSockets
