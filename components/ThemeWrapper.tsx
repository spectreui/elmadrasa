// components/ThemeWrapper.tsx
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../src/contexts/ThemeContext';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
  return (
    <View className={`flex-1 ${theme === 'dark' ? 'dark' : ''}`}>
      {children}
    </View>
  );
}