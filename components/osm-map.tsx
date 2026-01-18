import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  type: 'cruz_de_guia' | 'paso_cristo' | 'paso_virgen' | 'carrera_oficial';
}

interface MapRoute {
  coordinates: { latitude: number; longitude: number }[];
  color: string;
  weight?: number;
  opacity?: number;
}

interface OSMMapProps {
  center: { latitude: number; longitude: number };
  zoom?: number;
  markers?: MapMarker[];
  route?: MapRoute;
  routes?: MapRoute[]; // Multiple routes support
  primaryColor?: string;
  secondaryColor?: string;
  style?: object;
}

export function OSMMap({
  center,
  zoom = 15,
  markers = [],
  route,
  routes = [],
  primaryColor = '#5D2E8C',
  secondaryColor = '#D4AF37',
  style,
}: OSMMapProps) {
  // Generate the Leaflet HTML
  const generateMapHTML = () => {
    const getMarkerConfig = (type: MapMarker['type']) => {
      switch (type) {
        case 'cruz_de_guia':
          return {
            emoji: '✝️',
            className: 'cruz-marker',
            size: 44,
            bgColor: '#4A1942', // Dark purple
          };
        case 'paso_cristo':
          return {
            emoji: '✟',
            className: 'paso-cristo-marker',
            size: 52,
            bgColor: '#8B0000', // Dark red for Cristo
          };
        case 'paso_virgen':
          return {
            emoji: '👑',
            className: 'paso-virgen-marker',
            size: 52,
            bgColor: '#1E3A5F', // Dark blue for Virgen
          };
        case 'carrera_oficial':
          return {
            emoji: '🏛️',
            className: 'carrera-marker',
            size: 40,
            bgColor: '#2E7D32', // Green
          };
        default:
          return {
            emoji: '📍',
            className: 'default-marker',
            size: 36,
            bgColor: primaryColor,
          };
      }
    };

    const markersJS = markers
      .map((marker) => {
        const config = getMarkerConfig(marker.type);
        return `
          L.marker([${marker.latitude}, ${marker.longitude}], {
            icon: L.divIcon({
              className: '${config.className}',
              html: '<div class="marker-icon" style="background:${config.bgColor};width:${config.size}px;height:${config.size}px;"><span>${config.emoji}</span></div><div class="marker-pulse" style="border-color:${config.bgColor};width:${config.size + 16}px;height:${config.size + 16}px;"></div>',
              iconSize: [${config.size + 16}, ${config.size + 16}],
              iconAnchor: [${(config.size + 16) / 2}, ${(config.size + 16) / 2}]
            })
          }).addTo(map)${marker.title ? `.bindPopup('<strong>${marker.title}</strong>${marker.description ? `<br/><em>${marker.description}</em>` : ''}')` : ''};
        `;
      })
      .join('\n');

    // Generate routes - use routes array if provided, otherwise fall back to single route
    const allRoutes = routes.length > 0 ? routes : (route ? [route] : []);
    const routesJS = allRoutes
      .map((r) => `
        L.polyline([
          ${r.coordinates.map((c) => `[${c.latitude}, ${c.longitude}]`).join(',\n')}
        ], {
          color: '${r.color}',
          weight: ${r.weight ?? 5},
          opacity: ${r.opacity ?? 0.9},
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
      `)
      .join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; }
          
          .cruz-marker,
          .paso-cristo-marker,
          .paso-virgen-marker,
          .carrera-marker,
          .default-marker {
            background: transparent !important;
            border: none !important;
          }
          
          .marker-icon {
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            position: relative;
            z-index: 2;
            margin: 8px;
          }
          
          .marker-icon span {
            font-size: 22px;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          }
          
          .paso-cristo-marker .marker-icon span,
          .paso-virgen-marker .marker-icon span {
            font-size: 26px;
          }
          
          .marker-pulse {
            position: absolute;
            top: 0;
            left: 0;
            border: 3px solid;
            border-radius: 50%;
            opacity: 0.5;
            animation: pulse 2s ease-out infinite;
          }
          
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 0.6; }
            100% { transform: scale(1.3); opacity: 0; }
          }
          
          .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          }
          
          .leaflet-popup-content {
            margin: 14px 18px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
          }
          
          .leaflet-popup-content strong {
            color: #1a1a2e;
          }
          
          .leaflet-popup-content em {
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: true,
            attributionControl: true
          }).setView([${center.latitude}, ${center.longitude}], ${zoom});
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);
          
          ${routesJS}
          ${markersJS}
        </script>
      </body>
      </html>
    `;
  };

  const html = generateMapHTML();

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="OpenStreetMap"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
