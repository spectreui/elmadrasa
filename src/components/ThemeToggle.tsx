// src/components/ThemeToggle.tsx - REVAMPED
import React from 'react';
import { TouchableOpacity, View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '../contexts/ThemeContext';
import { cn, useTheme } from '../utils/themeUtils';
import { gradients } from '../utils/designSystem';
import { BlurView } from './ui/BlurView';

export function ThemeToggle() {
  const { themeMode, setThemeMode, isDark } = useThemeContext();
  const theme = useTheme();

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setThemeMode(nextTheme);
  };

  return (
    <BlurView intensity={20} className="rounded-3xl overflow-hidden">
      <LinearGradient
        colors={isDark ? ['#1e293b', '#334155'] : ['#f8fafc', '#f1f5f9']}
        className="p-6"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <LinearGradient
              colors={isDark ? gradients.secondary : gradients.primary}
              className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            >
              <Ionicons 
                name={isDark ? 'moon' : 'sunny'} 
                size={24} 
                color="white" 
              />
            </LinearGradient>
            <View>
              <Text className={cn("text-lg font-semibold", theme.colors.textPrimary)}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
              <Text className={cn("text-sm", theme.colors.textSecondary)}>
                {isDark ? 'Easy on the eyes' : 'Bright and clear'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#cbd5e1', true: '#475569' }}
            thumbColor={isDark ? '#c084fc' : '#38bdf8'}
          />
        </View>
      </LinearGradient>
    </BlurView>
  );
}