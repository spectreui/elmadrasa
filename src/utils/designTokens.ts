// src/utils/designTokens.ts
import { TextStyle } from 'react-native';

export const designTokens = {
  colors: {
    light: {
      // Primary Colors
      primary: '#007AFF',      // iOS Blue
      primaryLight: '#3399FF',
      primaryDark: '#0062CC',
      
      // Accent Colors
      accent: '#FF9500',       // iOS Orange
      accentSecondary: '#34C759', // iOS Green
      accentTertiary: '#FF3B30',  // iOS Red
      
      // Background Colors
      background: '#F2F2F7',   // iOS System Background
      backgroundElevated: '#FFFFFF',
      backgroundSecondary: '#FFFFFF',
      
      // Text Colors
      textPrimary: '#000000',
      textSecondary: '#8E8E93',
      textTertiary: '#C7C7CC',
      
      // UI Elements
      separator: '#C6C6C8',
      border: '#E5E5EA',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
    },
    dark: {
      // Primary Colors
      primary: '#0A84FF',
      primaryLight: '#409CFF',
      primaryDark: '#0066CC',
      
      // Accent Colors
      accent: '#FF9F0A',
      accentSecondary: '#30D158',
      accentTertiary: '#FF453A',
      
      // Background Colors
      background: '#000000',
      backgroundElevated: '#1C1C1E',
      backgroundSecondary: '#2C2C2E',
      
      // Text Colors
      textPrimary: '#FFFFFF',
      textSecondary: '#EBEBF5',
      textTertiary: '#98989A',
      
      // UI Elements
      separator: '#48484A',
      border: '#48484A',
      success: '#30D158',
      warning: '#FF9F0A',
      error: '#FF453A',
    }
  },
  typography: {
    largeTitle: { fontSize: 34, fontWeight: '700' as const },
    title1: { fontSize: 28, fontWeight: '700' as const },
    title2: { fontSize: 22, fontWeight: '600' as const },
    title3: { fontSize: 20, fontWeight: '600' as const },
    headline: { fontSize: 17, fontWeight: '600' as const },
    body: { fontSize: 17, fontWeight: '400' as const },
    callout: { fontSize: 16, fontWeight: '400' as const },
    subhead: { fontSize: 15, fontWeight: '400' as const },
    footnote: { fontSize: 13, fontWeight: '400' as const },
    caption1: { fontSize: 12, fontWeight: '400' as const },
    caption2: { fontSize: 11, fontWeight: '400' as const },
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 999,
  },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.00,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};