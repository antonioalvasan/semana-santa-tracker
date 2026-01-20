import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_BUTTON_WIDTH = (SCREEN_WIDTH - 32 - 32) / 5.5; // 5 días completos + vistazo de otro
const DAY_BUTTON_GAP = 8;

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProcessions } from '@/hooks/use-processions';
import type { Procession } from '@/types/data';

// Mapeo de días de la semana con días de Semana Santa
const HOLY_WEEK_DAYS = [
  { date: 0, dayName: 'Domingo 29', holyDay: 'Domingo de Ramos' },
  { date: 1, dayName: 'Lunes 30', holyDay: 'Lunes Santo' },
  { date: 2, dayName: 'Martes 31', holyDay: 'Martes Santo' },
  { date: 3, dayName: 'Miércoles 01', holyDay: 'Miércoles Santo' },
  { date: 4, dayName: 'Jueves 02', holyDay: 'Jueves Santo' },
  { date: 5, dayName: 'Viernes 03', holyDay: 'Viernes Santo' },
  { date: 6, dayName: 'Sábado 04', holyDay: 'Sábado Santo' },
  { date: 7, dayName: 'Domingo 05', holyDay: 'Domingo de Resurrección' },
];

// Orden de días para ordenar procesiones
const dayOrder: { [key: string]: number } = {
  'Domingo de Ramos': 0,
  'Lunes Santo': 1,
  'Martes Santo': 2,
  'Miércoles Santo': 3,
  'Jueves Santo': 4,
  'Viernes Santo': 5,
  'Sábado Santo': 6,
  'Domingo de Resurrección': 7,
};

const getProcessionsByDay = (allProcessions: Procession[]) => {
  const sorted = [...allProcessions].sort((a, b) => {
    const orderA = dayOrder[a.day] ?? 99;
    const orderB = dayOrder[b.day] ?? 99;
    return orderA - orderB;
  });

  const grouped: { [key: string]: Procession[] } = {};
  sorted.forEach((procession) => {
    if (!grouped[procession.day]) {
      grouped[procession.day] = [];
    }
    grouped[procession.day].push(procession);
  });

  return grouped;
};

export default function CalendarioScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const daysScrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<number[]>([]);
  const isUserScrolling = useRef(true);

  // Obtener datos de procesiones
  const { processions, isLoading } = useProcessions();
  const processionsByDay = getProcessionsByDay(processions);

  // Obtener todos los días que tienen procesiones, ordenados
  const allDaysWithProcessions = HOLY_WEEK_DAYS.filter(day => {
    return processionsByDay[day.holyDay] && processionsByDay[day.holyDay].length > 0;
  });

  // Scroll automático en la barra de días cuando cambia el día seleccionado
  useEffect(() => {
    if (daysScrollViewRef.current) {
      // Calcular la posición del día seleccionado
      const dayPosition = selectedDayIndex * (DAY_BUTTON_WIDTH + DAY_BUTTON_GAP);
      // Centrar el día seleccionado (restar la mitad del espacio visible menos medio botón)
      const visibleWidth = SCREEN_WIDTH - 32;
      const centeredPosition = dayPosition - (visibleWidth / 2) + (DAY_BUTTON_WIDTH / 2);
      
      daysScrollViewRef.current.scrollTo({
        x: Math.max(0, centeredPosition),
        animated: true,
      });
    }
  }, [selectedDayIndex]);

  // Manejar scroll para actualizar el día seleccionado
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isUserScrolling.current) return;
    
    const scrollY = event.nativeEvent.contentOffset.y;
    const labelHeight = 50; // Altura del label del día

    // Encontrar el día actual basándose en el scroll
    let newSelectedIndex = 0;
    
    for (let i = 0; i < sectionPositions.current.length; i++) {
      const sectionTop = sectionPositions.current[i];
      const labelExitPoint = sectionTop + labelHeight;
      
      // Si el scroll ha pasado el punto donde el label sale de la pantalla
      if (scrollY >= labelExitPoint) {
        // Seleccionar el siguiente día si existe
        if (i + 1 < sectionPositions.current.length) {
          newSelectedIndex = i + 1;
        } else {
          newSelectedIndex = i;
        }
      } else {
        break;
      }
    }
    
    if (newSelectedIndex !== selectedDayIndex) {
      setSelectedDayIndex(newSelectedIndex);
    }
  }, [selectedDayIndex]);

  // Manejar clic en un día del calendario
  const handleDayPress = useCallback((index: number) => {
    setSelectedDayIndex(index);
    
    const sectionTop = sectionPositions.current[index];
    if (sectionTop !== undefined) {
      isUserScrolling.current = false;
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, sectionTop - 10),
        animated: true,
      });
      // Reactivar el tracking de scroll después de la animación
      setTimeout(() => {
        isUserScrolling.current = true;
      }, 500);
    }
  }, []);

  // Guardar posición de una sección
  const handleSectionLayout = useCallback((index: number, y: number) => {
    sectionPositions.current[index] = y;
  }, []);

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text, marginTop: 16 }]}>Cargando procesiones...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header con calendario semanal */}
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.cardBorder }]}>
        <ScrollView
          ref={daysScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekCalendarContainer}
          snapToInterval={DAY_BUTTON_WIDTH + DAY_BUTTON_GAP}
          decelerationRate="fast"
        >
          {allDaysWithProcessions.map((day, index) => {
            let dayAbbrev = '';
            if (day.holyDay === 'Domingo de Ramos') {
              dayAbbrev = 'Do';
            } else if (day.holyDay === 'Domingo de Resurrección') {
              dayAbbrev = 'Do';
            } else {
              dayAbbrev = day.holyDay.split(' ')[0].substring(0, 2);
            }
            const dayNumber = day.dayName.split(' ')[1];
            const isSelected = selectedDayIndex === index;
            
            return (
              <TouchableOpacity
                key={day.date}
                style={[
                  styles.dayButton,
                  { width: DAY_BUTTON_WIDTH },
                  isSelected && { backgroundColor: colors.primary },
                  { borderColor: isSelected ? colors.primary : colors.cardBorder }
                ]}
                onPress={() => handleDayPress(index)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayShort,
                  { color: isSelected ? '#FFFFFF' : colors.text }
                ]}>
                  {dayAbbrev}
                </Text>
                <Text style={[
                  styles.dayDate,
                  { color: isSelected ? '#FFFFFF' : colors.text }
                ]}>
                  {dayNumber}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Mostrar todas las procesiones de todos los días */}
        {allDaysWithProcessions.map((dayInfo, dayIndex) => {
          const dayProcessions = processionsByDay[dayInfo.holyDay] || [];
          
          return (
            <View 
              key={dayInfo.holyDay} 
              style={styles.daySection}
              onLayout={(event) => {
                handleSectionLayout(dayIndex, event.nativeEvent.layout.y);
              }}
            >
              {/* Título del día */}
              <View style={styles.dayHeader}>
                <Text style={[styles.dayTitle, { color: colors.text }]}>
                  {dayInfo.dayName} - {dayInfo.holyDay}
                </Text>
              </View>

              {/* Tarjetas de procesiones del día */}
              {dayProcessions.map((procession) => {
                const isActive = procession.status === 'in_progress';
                const isReturning = procession.status === 'returning';
                
                return (
                  <TouchableOpacity
                    key={procession.id}
                    style={[
                      styles.processionCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: isActive ? colors.primary : colors.cardBorder,
                        borderLeftWidth: isActive || isReturning ? 4 : 1,
                        borderLeftColor: isActive ? '#4CAF50' : isReturning ? '#FF9800' : colors.cardBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    {/* Contenedor principal horizontal */}
                    <View style={styles.cardMain}>
                      {/* Columna izquierda: Hora y pasos */}
                      <View style={styles.timeColumn}>
                        <Text style={[styles.timeText, { color: colors.text }]}>
                          {procession.departureTime}
                        </Text>
                        <Text style={[styles.pasosLabel, { color: colors.icon }]}>
                          {procession.pasos.length} {procession.pasos.length === 1 ? 'paso' : 'pasos'}
                        </Text>
                      </View>

                      {/* Logo de la hermandad */}
                      <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
                        <Text style={styles.logoText}>✝</Text>
                      </View>

                      {/* Información de la hermandad */}
                      <View style={styles.infoContainer}>
                        <Text style={[styles.processionName, { color: colors.text }]} numberOfLines={1}>
                          {procession.name}
                        </Text>
                        <Text style={[styles.parishName, { color: colors.icon }]} numberOfLines={1}>
                          {procession.parish}
                        </Text>
                        
                        {/* Detalles adicionales */}
                        <View style={styles.detailsRow}>
                          <View style={styles.detailItem}>
                            <Text style={[styles.detailIcon, { color: colors.icon }]}>🏠</Text>
                            <Text style={[styles.detailText, { color: colors.icon }]}>
                              {procession.returnTime}
                            </Text>
                          </View>
                          
                          {isActive && (
                            <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                              <Text style={styles.statusText}>En calle</Text>
                            </View>
                          )}
                          {isReturning && (
                            <View style={[styles.statusBadge, { backgroundColor: '#FF9800' }]}>
                              <Text style={styles.statusText}>Regresando</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Flecha de navegación */}
                      <View style={styles.arrowContainer}>
                        <Text style={[styles.arrowIcon, { color: colors.icon }]}>›</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* Estado vacío si no hay procesiones */}
        {allDaysWithProcessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No hay procesiones programadas
            </Text>
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              Vuelve pronto para ver el calendario de procesiones
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  weekCalendarContainer: {
    flexDirection: 'row',
    gap: DAY_BUTTON_GAP,
    paddingHorizontal: 16,
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayShort: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  daySection: {
    marginBottom: 32,
  },
  dayHeader: {
    marginBottom: 16,
    paddingTop: 8,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  processionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeColumn: {
    alignItems: 'center',
    minWidth: 50,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  pasosLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  infoContainer: {
    flex: 1,
    gap: 2,
  },
  processionName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  parishName: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailIcon: {
    fontSize: 10,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  arrowContainer: {
    paddingLeft: 4,
  },
  arrowIcon: {
    fontSize: 24,
    fontWeight: '300',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
  },
});
