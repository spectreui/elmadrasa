// src/utils/themeUtils.ts - COMPLETELY REVAMPED
import { useColorScheme } from 'react-native';
import { colors, gradients, shadows, animations } from './designSystem';

export type Theme = {
  colors: {
    background: string;
    backgroundSecondary: string;
    backgroundElevated: string;
    backgroundBlur: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    border: string;
    borderLight: string;
    accent: string;
    accentGradient: string[];
    success: string;
    warning: string;
    error: string;
  };
  shadows: typeof shadows;
  animations: typeof animations;
};

export const lightTheme: Theme = {
  colors: {
    background: 'bg-white',
    backgroundSecondary: 'bg-gray-50',
    backgroundElevated: 'bg-white',
    backgroundBlur: 'bg-white/80',
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      tertiary: 'text-gray-500',
      inverse: 'text-white',
    },
    border: 'border-gray-200',
    borderLight: 'border-gray-100',
    accent: 'text-blue-600',
    accentGradient: gradients.primary,
    success: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
  },
  shadows,
  animations,
};

export const darkTheme: Theme = {
  colors: {
    background: 'bg-gray-900',
    backgroundSecondary: 'bg-gray-800',
    backgroundElevated: 'bg-gray-800',
    backgroundBlur: 'bg-gray-800/80',
    text: {
      primary: 'text-white',
      secondary: 'text-gray-300',
      tertiary: 'text-gray-400',
      inverse: 'text-gray-900',
    },
    border: 'border-gray-700',
    borderLight: 'border-gray-600',
    accent: 'text-blue-400',
    accentGradient: gradients.secondary,
    success: 'text-green-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
  },
  shadows,
  animations,
};

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const useTheme = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};