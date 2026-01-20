import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useCallback } from 'react';

import { Colors } from '@/constants/theme';
import type { Procession } from '@/types/data';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProcessions } from '@/hooks/use-processions';

// Mapeo de días de la semana con días de Semana Santa
const HOLY_WEEK_DAYS = [
  { date: 0, dayName: 'Domingo 29', holyDay: 'Domingo de Ramos' },
  { date: 1, dayName: 'Lunes 30', holyDay: 'Lunes Santo' },
  { date: 2, dayName: 'Martes 31', holyDay: 'Martes Santo' },
  { date: 3, dayName: 'Miércoles 01', holyDay: 'Miércoles Santo' },
  { date: 4, dayName: 'Jueves 02', holyDay: 'Jueves Santo' },
  { date: 5, dayName: 'Viernes 03', holyDay: 'Viernes Santo' },
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
  const sectionPositions = useRef<number[]>([]);
  const isUserScrolling = useRef(true);

  // Obtener datos de procesiones
  const { processions, isLoading } = useProcessions();
  const processionsByDay = getProcessionsByDay(processions);

  // Obtener todos los días que tienen procesiones, ordenados
  const allDaysWithProcessions = HOLY_WEEK_DAYS.filter(day => {
    return processionsByDay[day.holyDay] && processionsByDay[day.holyDay].length > 0;
  });

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
        <View style={styles.weekCalendarContainer}>
          {allDaysWithProcessions.map((day, index) => {
            let dayAbbrev = '';
            if (day.holyDay === 'Domingo de Ramos') {
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
                  isSelected && { backgroundColor: colors.primary },
                  { borderColor: colors.cardBorder }
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
        </View>
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
              {dayProcessions.map((procession) => (
                <TouchableOpacity
                  key={procession.id}
                  style={[
                    styles.processionCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  {/* Contenedor principal horizontal */}
                  <View style={styles.cardMain}>
                    {/* Hora */}
                    <View style={[styles.timeContainer, { backgroundColor: colors.background }]}>
                      <Text style={[styles.timeText, { color: colors.text }]}>
                        {procession.departureTime}
                      </Text>
                    </View>

                    {/* Color/Logo de la hermandad */}
                    <View style={[styles.brotherhoodLogo, { backgroundColor: colors.primary }]}>
                      <View style={styles.logoInner}>
                        <Text style={styles.logoText}>IMG</Text>
                      </View>
                    </View>

                    {/* Información de la hermandad */}
                    <View style={styles.infoContainer}>
                      <Text style={[styles.processionTitle, { color: colors.text }]} numberOfLines={1}>
                        {procession.name}
                      </Text>
                      <Text style={[styles.parishName, { color: colors.icon }]} numberOfLines={1}>
                        {procession.parish}
                      </Text>
                    </View>

                    {/* Número de pasos */}
                    <View style={[styles.pasosBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                      <Text style={[styles.pasosNumber, { color: colors.primary }]}>
                        {procession.pasos.length}
                      </Text>
                      <Text style={[styles.pasosLabel, { color: colors.primary }]}>
                        Pasos
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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
    gap: 8,
    paddingHorizontal: 4,
  },
  dayButton: {
    flex: 1,
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
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timeContainer: {
    minWidth: 60,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brotherhoodLogo: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoInner: {
    transform: [{ rotate: '-45deg' }],
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  processionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  parishName: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  pasosBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 60,
  },
  pasosNumber: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  pasosLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
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
