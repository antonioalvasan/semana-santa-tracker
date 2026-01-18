import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/contexts/theme-context';

export default function InicioScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { toggleTheme } = useTheme();

  // Calcular días hasta Semana Santa 2026
  // Domingo de Ramos: 29 de marzo de 2026
  const semanaSantaDate = new Date('2026-03-29');
  const today = new Date();
  const diffTime = semanaSantaDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleSettings = () => {
    // TODO: Implementar navegación a configuración
    console.log('Settings pressed');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header con botones */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Semana Santa</Text>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>Huelva 2026</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            onPress={handleThemeToggle}
          >
            <IconSymbol 
              size={22} 
              name={colorScheme === 'light' ? 'sun.max.fill' : 'moon.fill'} 
              color={colors.icon} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            onPress={handleSettings}
          >
            <IconSymbol size={22} name="gearshape.fill" color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        <View style={[styles.countdownCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Text style={styles.iconEmoji}>✝️</Text>
          </View>
          
          <Text style={[styles.countdownLabel, { color: colors.icon }]}>
            Faltan para la Semana Santa
          </Text>
          
          <View style={styles.countdownNumber}>
            <Text style={[styles.daysNumber, { color: colors.primary }]}>
              {diffDays}
            </Text>
            <Text style={[styles.daysLabel, { color: colors.text }]}>
              {diffDays === 1 ? 'día' : 'días'}
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
          
          <View style={styles.dateInfo}>
            <Text style={[styles.dateLabel, { color: colors.icon }]}>
              Domingo de Ramos
            </Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>
              29 de Marzo, 2026
            </Text>
          </View>
        </View>

        {/* Tarjeta informativa adicional */}
        <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Bienvenido al Tracker
          </Text>
          <Text style={[styles.infoText, { color: colors.icon }]}>
            Sigue en tiempo real todas las procesiones de la Semana Santa de Huelva. 
            Consulta horarios, recorridos y detalles de cada hermandad.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  countdownCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 40,
  },
  countdownLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  countdownNumber: {
    alignItems: 'center',
    marginBottom: 24,
  },
  daysNumber: {
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 72,
  },
  daysLabel: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 24,
  },
  dateInfo: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
