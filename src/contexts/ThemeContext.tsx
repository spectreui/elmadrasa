// src/contexts/ThemeContext.tsx - FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { designTokens } from '../utils/designTokens';
import { useLanguage } from './LanguageContext';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: typeof designTokens.colors.light | typeof designTokens.colors.dark;
  toggleTheme: () => void;
  fontFamily: string; // 👈 added
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');
  
  const { isRTL, language } = useLanguage(); // Get isRTL from language context
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

  useEffect(() => {
    loadThemePreference();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme || 'light');
    });

    return () => subscription.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    if (themeMode === 'auto') {
      // If auto, set to opposite of current system theme
      const newMode = systemTheme === 'dark' ? 'light' : 'dark';
      await setThemeMode(newMode);
    } else {
      // If explicit mode, toggle between light and dark
      const newMode = themeMode === 'dark' ? 'light' : 'dark';
      await setThemeMode(newMode);
    }
  };

  const isDark = themeMode === 'auto' ? systemTheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? designTokens.colors.dark : designTokens.colors.light;
 // 👇 Choose font based on language
  const fontFamily = language === 'ar' ? 'SF-Arabic-Rounded' : 'SF-Pro-Regular, SF-Pro-Medium, SF-Pro-Bold, SF-Pro-Black';

  const value = {
    themeMode,
    setThemeMode,
    isDark,
    colors,
    toggleTheme,
    fontFamily, // 👈 expose font to rest of app
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
