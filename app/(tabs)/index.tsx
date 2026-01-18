import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OSMMap } from '@/components/osm-map';
import { Colors } from '@/constants/theme';
import { HUELVA_CENTER, MOCK_PROCESSIONS, type Procession } from '@/data/processions';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProcessionRoute } from '@/hooks/use-procession-route';

// Get the first active procession for display
const activeProcession = MOCK_PROCESSIONS.find(p => p.status === 'in_progress') || MOCK_PROCESSIONS[0];

export default function ProcessionMapScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const procession: Procession = activeProcession;

  // Fetch the real street-following route from OSRM
  const { routeCoordinates, distance, duration, isLoading } = useProcessionRoute(procession);

  // Prepare markers for the map
  const markers = [
    // Cruz de Guía marker (front of procession)
    {
      id: 'cruz-de-guia',
      latitude: procession.cruzDeGuia.latitude,
      longitude: procession.cruzDeGuia.longitude,
      title: 'Cruz de Guía',
      description: 'Inicio de la procesión',
      type: 'cruz_de_guia' as const,
    },
    // Paso markers (each float)
    ...procession.pasos.map((paso) => ({
      id: paso.id,
      latitude: paso.currentPosition.latitude,
      longitude: paso.currentPosition.longitude,
      title: paso.name,
      description: paso.type === 'cristo' ? 'Paso de Cristo' : 'Paso de Virgen',
      type: paso.type === 'cristo' ? 'paso_cristo' as const : 'paso_virgen' as const,
    })),
    // Carrera Oficial markers
    {
      id: 'carrera-inicio',
      latitude: procession.carreraOficial.start.latitude,
      longitude: procession.carreraOficial.start.longitude,
      title: 'Carrera Oficial',
      description: 'Inicio',
      type: 'carrera_oficial' as const,
    },
    {
      id: 'carrera-fin',
      latitude: procession.carreraOficial.end.latitude,
      longitude: procession.carreraOficial.end.longitude,
      title: 'Carrera Oficial',
      description: 'Fin',
      type: 'carrera_oficial' as const,
    },
  ];

  return (
    <View style={styles.container}>
      {/* OpenStreetMap with OSRM route */}
      <OSMMap
        center={HUELVA_CENTER}
        zoom={16}
        markers={markers}
        route={
          routeCoordinates.length > 0
            ? {
                coordinates: routeCoordinates,
                color: colors.primary,
              }
            : undefined
        }
        primaryColor={colors.primary}
        secondaryColor={colors.secondary}
        style={styles.map}
      />

      {/* Loading indicator for route */}
      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.mapOverlay }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Calculando ruta...</Text>
        </View>
      )}

      {/* Header Overlay */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 8, backgroundColor: colors.mapOverlay }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Semana Santa</Text>
        <Text style={[styles.headerSubtitle, { color: colors.primary }]}>Huelva 2026</Text>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIcon, { backgroundColor: '#4A1942' }]}>
            <Text style={styles.legendEmoji}>✝️</Text>
          </View>
          <Text style={[styles.legendText, { color: colors.text }]}>Cruz de Guía</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIcon, { backgroundColor: '#8B0000' }]}>
            <Text style={styles.legendEmoji}>✟</Text>
          </View>
          <Text style={[styles.legendText, { color: colors.text }]}>Paso Cristo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIcon, { backgroundColor: '#1E3A5F' }]}>
            <Text style={styles.legendEmoji}>👑</Text>
          </View>
          <Text style={[styles.legendText, { color: colors.text }]}>Paso Virgen</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIcon, { backgroundColor: '#2E7D32' }]}>
            <Text style={styles.legendEmoji}>🏛️</Text>
          </View>
          <Text style={[styles.legendText, { color: colors.text }]}>Carrera Oficial</Text>
        </View>
      </View>

      {/* Procession Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, marginBottom: insets.bottom + 90 }]}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: procession.status === 'in_progress' ? '#2E7D32' : colors.primary }]}>
          <Text style={styles.statusText}>
            {procession.status === 'in_progress' ? '● EN CALLE' : 'PRÓXIMA'}
          </Text>
        </View>

        {/* Procession Name */}
        <Text style={[styles.processionName, { color: colors.text }]}>{procession.name}</Text>
        <Text style={[styles.brotherhood, { color: colors.icon }]}>{procession.brotherhood}</Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>Día</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{procession.day}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>Salida</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{procession.departureTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>Pasos</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{procession.pasos.length}</Text>
          </View>
        </View>

        {/* Route info from OSRM */}
        {distance && duration && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.routeInfo}>
              <View style={styles.routeItem}>
                <Text style={[styles.routeIcon]}>📏</Text>
                <Text style={[styles.routeValue, { color: colors.text }]}>{distance}</Text>
              </View>
              <View style={styles.routeItem}>
                <Text style={[styles.routeIcon]}>⏱️</Text>
                <Text style={[styles.routeValue, { color: colors.text }]}>{duration}</Text>
              </View>
            </View>
          </>
        )}

        {/* Parish */}
        <View style={styles.parishContainer}>
          <Text style={[styles.parishIcon, { color: colors.secondary }]}>📍</Text>
          <Text style={[styles.parishText, { color: colors.icon }]}>{procession.parish}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  legend: {
    position: 'absolute',
    top: 100,
    right: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendEmoji: {
    fontSize: 12,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  processionName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brotherhood: {
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeIcon: {
    fontSize: 16,
  },
  routeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  parishContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  parishIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  parishText: {
    fontSize: 13,
    flex: 1,
  },
});
