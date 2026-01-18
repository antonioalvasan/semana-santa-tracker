import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OSMMap } from '@/components/osm-map';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProcessionRoute } from '@/hooks/use-procession-route';
import { useConfig, useProcessions } from '@/hooks/use-processions';
import type { Procession } from '@/types/data';

export default function ProcessionMapScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  // Get processions data from the new hook
  const { processions, isLoading: processionsLoading, getActiveProcession, getProcessionsByDay } = useProcessions();
  const { config, isLoading: configLoading } = useConfig();

  // Get the first active procession for display
  const activeProcession = getActiveProcession() || processions[0];

  // Get the current day processions
  const currentDay = activeProcession?.day || '';
  const dayProcessions = currentDay ? getProcessionsByDay(currentDay) : [];
  
  // State for selected procession
  const [selectedProcession, setSelectedProcession] = useState<Procession | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  // Update selected procession when data loads
  useEffect(() => {
    if (!selectedProcession && activeProcession) {
      setSelectedProcession(activeProcession);
    }
  }, [activeProcession, selectedProcession]);

  const procession = selectedProcession;

  // Fetch the real street-following route from OSRM for selected procession
  const { routeCoordinates, distance, duration, isLoading } = useProcessionRoute(procession);

  // Store all routes for the day
  const [allRoutes, setAllRoutes] = useState<{ [key: string]: { latitude: number; longitude: number }[] }>({});

  // Load all routes for processions of the day
  useEffect(() => {
    const loadAllRoutes = async () => {
      const routes: { [key: string]: { latitude: number; longitude: number }[] } = {};
      
      // For now, use the basic route coordinates from the data
      // In a real scenario, we could load all from OSRM, but that would be too many API calls
      dayProcessions.forEach(proc => {
        routes[proc.id] = proc.route.map(point => ({
          latitude: point.latitude,
          longitude: point.longitude,
        }));
      });
      
      setAllRoutes(routes);
    };
    
    loadAllRoutes();
  }, [currentDay]);

  // Prepare markers for the map (only for selected procession)
  const markers = procession ? [
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
  ] : [];

  // Prepare all routes with colors
  const mapRoutes = dayProcessions.map((proc, index) => {
    const isSelected = proc.id === selectedProcession?.id;
    const routeCoords = proc.id === selectedProcession?.id && routeCoordinates.length > 0
      ? routeCoordinates
      : allRoutes[proc.id] || [];
    
    const brotherhoodColors = config?.brotherhoodColors || [];
    const darkRouteColors = config?.darkRouteColors || [];
    
    return {
      coordinates: routeCoords,
      color: isSelected 
        ? brotherhoodColors[index % brotherhoodColors.length] 
        : darkRouteColors[index % darkRouteColors.length],
      weight: isSelected ? 6 : 4,
      opacity: isSelected ? 0.95 : 0.5,
    };
  }).filter(route => route.coordinates.length > 0);

  // Show loading state
  if (processionsLoading || configLoading || !procession || !config) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text, marginTop: 16 }]}>Cargando procesiones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* OpenStreetMap with all routes */}
      <OSMMap
        center={config.huelvaCenter}
        zoom={16}
        markers={markers}
        routes={mapRoutes}
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

      {/* Compact Procession Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, marginBottom: insets.bottom + 90 }]}>
        {/* Selector Button */}
        <TouchableOpacity 
          style={[styles.selectorButton, { borderColor: colors.cardBorder }]}
          onPress={() => setShowSelector(true)}
        >
          <View style={styles.selectorContent}>
            <View style={styles.selectorLeft}>
              <Text style={[styles.processionNameCompact, { color: colors.text }]}>{procession.name}</Text>
              <Text style={[styles.brotherhoodCompact, { color: colors.icon }]}>
                {procession.departureTime} • {procession.pasos.length} pasos
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.icon }]}>▼</Text>
          </View>
        </TouchableOpacity>

        {/* Status Badge */}
        <View style={[styles.statusBadgeCompact, { backgroundColor: procession.status === 'in_progress' ? '#2E7D32' : colors.primary }]}>
          <Text style={styles.statusTextCompact}>
            {procession.status === 'in_progress' ? '● EN CALLE' : 'PRÓXIMA'}
          </Text>
        </View>
      </View>

      {/* Procession Selector Modal */}
      <Modal
        visible={showSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSelector(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSelector(false)}
        >
          <View style={[styles.selectorModal, { backgroundColor: colors.cardBackground, marginBottom: insets.bottom }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.icon }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Hermandades - {currentDay}</Text>
            
            <ScrollView style={styles.procesionList}>
              {dayProcessions.map((proc, index) => (
                <TouchableOpacity
                  key={proc.id}
                  style={[
                    styles.procesionItem,
                    { borderColor: colors.cardBorder },
                    proc.id === selectedProcession?.id && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setSelectedProcession(proc);
                    setShowSelector(false);
                  }}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: config.brotherhoodColors[index % config.brotherhoodColors.length] }]} />
                  <View style={styles.procesionInfo}>
                    <Text style={[styles.procesionItemName, { color: colors.text }]}>{proc.name}</Text>
                    <Text style={[styles.procesionItemDetails, { color: colors.icon }]}>
                      {proc.brotherhood}
                    </Text>
                    <Text style={[styles.procesionItemTime, { color: colors.icon }]}>
                      {proc.departureTime} - {proc.returnTime}
                    </Text>
                  </View>
                  {proc.id === selectedProcession?.id && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  selectorButton: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorLeft: {
    flex: 1,
  },
  processionNameCompact: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  brotherhoodCompact: {
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 12,
    marginLeft: 8,
  },
  statusBadgeCompact: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusTextCompact: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  selectorModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  procesionList: {
    flex: 1,
  },
  procesionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  colorIndicator: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: 12,
  },
  procesionInfo: {
    flex: 1,
  },
  procesionItemName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  procesionItemDetails: {
    fontSize: 12,
    marginBottom: 2,
  },
  procesionItemTime: {
    fontSize: 11,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
});
