import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import type { Procession } from '@/types/data';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProcessions } from '@/hooks/use-processions';

// Sort processions by day order (you can customize this order)
const dayOrder = {
  'Domingo de Ramos': 1,
  'Lunes Santo': 2,
  'Martes Santo': 3,
  'Miércoles Santo': 4,
  'Jueves Santo': 5,
  'Viernes Santo': 6,
  'Sábado Santo': 7,
  'Domingo de Resurrección': 8,
};

const getProcessionsByDay = (allProcessions: Procession[]) => {
  const sorted = [...allProcessions].sort((a, b) => {
    const orderA = dayOrder[a.day as keyof typeof dayOrder] || 99;
    const orderB = dayOrder[b.day as keyof typeof dayOrder] || 99;
    return orderA - orderB;
  });

  // Group by day
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

  // Get processions data from the new hook
  const { processions, isLoading } = useProcessions();

  const processionsByDay = getProcessionsByDay(processions);

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.emptyText, { color: colors.text, marginTop: 16 }]}>Cargando procesiones...</Text>
      </View>
    );
  }

  const getStatusInfo = (status: Procession['status']) => {
    switch (status) {
      case 'in_progress':
        return { text: '● EN CALLE', color: '#2E7D32' };
      case 'returning':
        return { text: '● REGRESO', color: '#F57C00' };
      case 'finished':
        return { text: '● FINALIZADA', color: '#616161' };
      default:
        return { text: 'PRÓXIMA', color: colors.primary };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calendario</Text>
        <Text style={[styles.headerSubtitle, { color: colors.primary }]}>Semana Santa 2026</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(processionsByDay).map(([day, processions]) => (
          <View key={day} style={styles.daySection}>
            {/* Day Header */}
            <View style={[styles.dayHeader, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>{day}</Text>
              <View style={[styles.dayBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.dayBadgeText, { color: colors.primary }]}>
                  {processions.length} {processions.length === 1 ? 'procesión' : 'procesiones'}
                </Text>
              </View>
            </View>

            {/* Processions for this day */}
            {processions.map((procession) => {
              const statusInfo = getStatusInfo(procession.status);
              
              return (
                <View
                  key={procession.id}
                  style={[
                    styles.processionCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  {/* Status Badge */}
                  {procession.status !== 'not_started' && (
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                      <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </View>
                  )}

                  {/* Time Badge */}
                  <View style={[styles.timeBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.timeIcon}>🕐</Text>
                    <Text style={styles.timeText}>{procession.departureTime}</Text>
                  </View>

                  {/* Procession Name */}
                  <Text style={[styles.processionName, { color: colors.text }]}>
                    {procession.name}
                  </Text>

                  {/* Brotherhood */}
                  <Text style={[styles.brotherhood, { color: colors.icon }]}>
                    {procession.brotherhood}
                  </Text>

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                  {/* Details */}
                  <View style={styles.details}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📍</Text>
                      <Text style={[styles.detailText, { color: colors.icon }]} numberOfLines={1}>
                        {procession.parish}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>✝️</Text>
                      <Text style={[styles.detailText, { color: colors.icon }]}>
                        {procession.pasos.length} {procession.pasos.length === 1 ? 'paso' : 'pasos'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>🏠</Text>
                      <Text style={[styles.detailText, { color: colors.icon }]}>
                        Regreso: {procession.returnTime}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  {procession.description && (
                    <>
                      <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
                      <Text style={[styles.description, { color: colors.icon }]} numberOfLines={2}>
                        {procession.description}
                      </Text>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* Empty State */}
        {Object.keys(processionsByDay).length === 0 && (
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
  },
  daySection: {
    gap: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 2,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  processionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  timeIcon: {
    fontSize: 14,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  processionName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  brotherhood: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
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
});
