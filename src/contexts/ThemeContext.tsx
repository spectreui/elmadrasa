import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useLanguage } from './LanguageContext'; // Import useLanguage
import { designTokens } from '@/utils/designTokens';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    primary: string;
    background: string;
    backgroundElevated: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    separator: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const { isRTL } = useLanguage(); // Get isRTL from language context
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  // Sync with system theme changes
  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Define your color palette
  const colors = isDark ? designTokens.colors.light : designTokens.colors.light;

  // Apply RTL to the app
  useEffect(() => {
    import('react-native').then(({ I18nManager }) => {
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
        // Optionally restart the app for full RTL support
        // You might want to show a restart prompt to users
      }
    });
  }, [isRTL]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
