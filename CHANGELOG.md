# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added - Data Architecture Overhaul

#### New Architecture
- Implemented service-based data management with repository pattern
- Created type-safe TypeScript interfaces in `/types/data.ts`
- Added JSON-based data storage (`processions.json`, `config.json`)
- Implemented `DataService` singleton for centralized data operations
- Created `IProcessionRepository` interface for data abstraction
- Added `MockRepository` implementation for JSON data
- Added `APIRepository` skeleton for future REST API integration
- Created `useProcessions()` React hook for easy component integration
- Added `useConfig()` hook for application configuration

#### Documentation
- Added comprehensive [Data Architecture Documentation](./docs/DATA-ARCHITECTURE.md)
- Created [Migration Guide](./docs/MIGRATION-GUIDE.md) for developers
- Updated main README with architecture overview

#### Features
- Full CRUD operations support (Create, Read, Update, Delete)
- Automatic state management and updates
- Loading and error states
- Data caching for improved performance
- Subscribe/notify pattern for real-time updates
- Filter support for querying data
- Easy switch between JSON mock and REST API

#### Component Updates
- Updated `app/(tabs)/index.tsx` to use new hook
- Updated `app/(tabs)/calendario.tsx` to use new hook
- Added loading states and error handling
- Improved type safety throughout

#### Developer Experience
- Seamless transition path from JSON to REST API
- No component changes needed when switching data sources
- Better testing capabilities with mockable services
- Type-safe operations with full TypeScript support

### Changed
- Data access now asynchronous (returns Promises)
- Components use hooks instead of direct imports
- Configuration moved from TypeScript to JSON

### Deprecated
- Direct imports from `/data/processions.ts` (marked as deprecated)
- Synchronous data access patterns

### Technical Details

**Files Created:**
- `/types/data.ts` - Type definitions
- `/data/processions.json` - Procession data
- `/data/config.json` - App configuration
- `/services/data-service.ts` - Main service
- `/services/repositories/IProcessionRepository.ts` - Interface
- `/services/repositories/MockRepository.ts` - JSON implementation
- `/services/repositories/APIRepository.ts` - API skeleton
- `/services/repositories/index.ts` - Repository exports
- `/hooks/use-processions.ts` - React hook
- `/docs/DATA-ARCHITECTURE.md` - Architecture docs
- `/docs/MIGRATION-GUIDE.md` - Migration guide
- `CHANGELOG.md` - This file

**Files Modified:**
- `/app/(tabs)/index.tsx` - Uses new hook
- `/app/(tabs)/calendario.tsx` - Uses new hook
- `/README.md` - Added architecture info
- `/data/processions.ts` - Marked as deprecated

**Migration Impact:**
- Breaking change for any code directly importing from `/data/processions.ts`
- Components now need to handle loading/error states
- Data access is now asynchronous

**Benefits:**
1. Clean separation of concerns
2. Easy testing with mockable services
3. Seamless API integration path
4. Type-safe operations
5. Improved error handling
6. Better state management
7. Real-time update support

## [Previous Versions]

### Initial Release
- OpenStreetMap integration
- OSRM routing support
- Calendar view
- Basic procession tracking
- Theme support (light/dark)
