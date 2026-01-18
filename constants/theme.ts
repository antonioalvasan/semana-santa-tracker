/**
 * Theme colors for Semana Santa Tracker - Huelva
 * Inspired by the rich purples, golds, and deep reds of Holy Week processions
 */

import { Platform } from 'react-native';

// Holy Week themed colors
const tintColorLight = '#5D2E8C'; // Deep purple - penitential color
const tintColorDark = '#D4AF37'; // Gold - color of the thrones

export const Colors = {
  light: {
    text: '#1A1A2E',
    background: '#FAF8F5',
    tint: tintColorLight,
    icon: '#5D2E8C',
    tabIconDefault: '#8B7E9B',
    tabIconSelected: tintColorLight,
    // Semana Santa specific colors
    primary: '#5D2E8C', // Deep purple
    secondary: '#D4AF37', // Gold
    accent: '#8B0000', // Deep red
    cardBackground: '#FFFFFF',
    cardBorder: '#E8E0F0',
    mapOverlay: 'rgba(93, 46, 140, 0.1)',
  },
  dark: {
    text: '#F5F3F0',
    background: '#0D0D1A',
    tint: tintColorDark,
    icon: '#D4AF37',
    tabIconDefault: '#7A7A8C',
    tabIconSelected: tintColorDark,
    // Semana Santa specific colors
    primary: '#7B4BA8', // Lighter purple for dark mode
    secondary: '#D4AF37', // Gold
    accent: '#CD5C5C', // Indian red
    cardBackground: '#1A1A2E',
    cardBorder: '#2D2D4A',
    mapOverlay: 'rgba(212, 175, 55, 0.1)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
