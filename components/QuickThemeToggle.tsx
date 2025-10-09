// components/QuickThemeToggle.tsx
import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';

export function QuickThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [isToggling, setIsToggling] = useState(false);

  const handlePress = () => {
    if (isToggling) return;
    
    setIsToggling(true);
    toggleTheme();
    
    // Reset after a short delay to prevent double taps
    setTimeout(() => {
      setIsToggling(false);
    }, 300);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isToggling}
      className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center"
    >
      <Ionicons
        name={theme === 'light' ? 'moon' : 'sunny'}
        size={20}
        color={theme === 'light' ? '#000' : '#fff'}
      />
    </TouchableOpacity>
  );
}