# Integración de OSRM (Open Source Routing Machine)

## ¿Qué es OSRM?

**OSRM** (Open Source Routing Machine) es un motor de enrutamiento de alto rendimiento escrito en C++ y diseñado para calcular rutas en redes viales de OpenStreetMap. Es utilizado por millones de aplicaciones para calcular rutas que siguen calles reales.

### Características principales:
- ✅ **Gratuito y Open Source**
- ✅ **Basado en OpenStreetMap** - datos actualizados de calles reales
- ✅ **Alta precisión** - las rutas siguen exactamente las calles
- ✅ **Perfiles de transporte** - coche, bicicleta, a pie
- ✅ **API pública de demostración** disponible

---

## Arquitectura de la integración

```
┌─────────────────────────────────────────────────────────────────┐
│                        App (React Native)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌───────────────────┐    ┌──────────────┐ │
│  │   index.tsx  │───▶│useProcessionRoute │───▶│  OSMMap.tsx  │ │
│  │  (Pantalla)  │    │     (Hook)        │    │ (Componente) │ │
│  └──────────────┘    └─────────┬─────────┘    └──────────────┘ │
│                                │                                 │
│                                ▼                                 │
│                    ┌───────────────────┐                        │
│                    │   routing.ts      │                        │
│                    │   (Servicio)      │                        │
│                    └─────────┬─────────┘                        │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTP Request
                               ▼
                    ┌───────────────────┐
                    │   OSRM API        │
                    │ router.project-   │
                    │ osrm.org          │
                    └───────────────────┘
```

---

## Archivos creados

### 1. `services/routing.ts`

Servicio principal que se comunica con la API de OSRM.

```typescript
// Función principal para obtener una ruta
export async function getRoute(waypoints: Coordinate[]): Promise<RouteResult>
```

**¿Cómo funciona?**

1. Recibe un array de coordenadas (waypoints)
2. Construye la URL de la API OSRM
3. Hace una petición HTTP GET
4. Parsea la respuesta GeoJSON
5. Devuelve las coordenadas de la ruta + distancia + duración

**Ejemplo de llamada a la API:**

```
GET https://router.project-osrm.org/route/v1/foot/-6.9534,37.2563;-6.9470,37.2612?overview=full&geometries=geojson
```

**Respuesta de OSRM (simplificada):**

```json
{
  "code": "Ok",
  "routes": [{
    "geometry": {
      "coordinates": [
        [-6.9534, 37.2563],
        [-6.9530, 37.2565],
        [-6.9525, 37.2568],
        // ... cientos de puntos siguiendo las calles
        [-6.9470, 37.2612]
      ]
    },
    "distance": 850.5,
    "duration": 612.3
  }]
}
```

### 2. `hooks/use-procession-route.ts`

Hook de React que gestiona el estado de la ruta.

```typescript
export function useProcessionRoute(procession: Procession): UseProcessionRouteResult
```

**Retorna:**
- `routeCoordinates` - Coordenadas de la ruta calculada por OSRM
- `distance` - Distancia formateada ("1.2 km")
- `duration` - Duración formateada ("15 min")
- `isLoading` - Estado de carga
- `error` - Mensaje de error si falla

**Características:**
- ✅ Caché automático por `procession.id`
- ✅ Fallback a coordenadas originales si OSRM falla
- ✅ Manejo de errores robusto

---

## Flujo de datos

```
1. El usuario abre la app
        │
        ▼
2. Se monta ProcessionMapScreen
        │
        ▼
3. useProcessionRoute() se ejecuta
        │
        ▼
4. Extrae waypoints del procession.route
   [punto1, punto2, punto3, ...]
        │
        ▼
5. Llama a getProcessionRoute(waypoints)
        │
        ▼
6. routing.ts construye la URL:
   /route/v1/foot/lng1,lat1;lng2,lat2;...
        │
        ▼
7. OSRM calcula la ruta por calles reales
        │
        ▼
8. Retorna ~200-500 coordenadas precisas
        │
        ▼
9. OSMMap dibuja la Polyline con esos puntos
        │
        ▼
10. La ruta aparece siguiendo las calles ✨
```

---

## Diferencia visual

### Antes (líneas rectas)
```
    A ─────────────── B
    │                 │
    │    (atraviesa   │
    │     edificios)  │
    │                 │
    C ─────────────── D
```

### Después (OSRM - calles reales)
```
    A ──┐
        │  Calle 1
        └──┐
           │  Calle 2
           └──┐
              │
              B
```

---

## Parámetros de la API OSRM

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `profile` | `foot` | Modo a pie (para procesiones) |
| `overview` | `full` | Geometría completa de la ruta |
| `geometries` | `geojson` | Formato de salida GeoJSON |

### Otros perfiles disponibles:
- `car` - Rutas para coches
- `bike` - Rutas para bicicletas
- `foot` - Rutas a pie ✅ (usamos este)

---

## Limitaciones del servidor público

El servidor `router.project-osrm.org` es un **servidor de demostración**:

| Límite | Valor |
|--------|-------|
| Rate limit | ~1 request/segundo |
| Waypoints máximos | ~100 por petición |
| Disponibilidad | No garantizada |

### Para producción

Se recomienda usar un servidor OSRM propio o un servicio de pago:

```bash
# Ejecutar OSRM con Docker
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/spain-latest.osrm
```

O usar servicios alternativos:
- **OpenRouteService** - Tier gratuito disponible
- **GraphHopper** - API similar
- **Mapbox Directions** - De pago pero muy robusto

---

## Uso en el código

### Obtener una ruta simple:

```typescript
import { getRoute } from '@/services/routing';

const waypoints = [
  { latitude: 37.2563, longitude: -6.9534 }, // Origen
  { latitude: 37.2612, longitude: -6.9470 }, // Destino
];

const route = await getRoute(waypoints);
console.log(route.coordinates); // Array de coordenadas
console.log(route.distance);    // 850 (metros)
console.log(route.duration);    // 612 (segundos)
```

### Usar el hook en un componente:

```typescript
import { useProcessionRoute } from '@/hooks/use-procession-route';

function MyComponent({ procession }) {
  const { routeCoordinates, distance, duration, isLoading } = useProcessionRoute(procession);

  if (isLoading) return <Text>Calculando ruta...</Text>;

  return (
    <OSMMap
      route={{
        coordinates: routeCoordinates,
        color: '#5D2E8C',
      }}
    />
  );
}
```

---

## Próximos pasos sugeridos

1. **Caché persistente** - Guardar rutas en AsyncStorage para evitar peticiones repetidas
2. **Servidor OSRM propio** - Para mayor control y disponibilidad
3. **Rutas offline** - Pre-calcular y almacenar rutas de todas las procesiones
4. **Animación de ruta** - Mostrar el progreso animado de la procesión

---

## Referencias

- [OSRM Project](http://project-osrm.org/)
- [OSRM API Documentation](http://project-osrm.org/docs/v5.24.0/api/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [OSRM Docker](https://hub.docker.com/r/osrm/osrm-backend/)

