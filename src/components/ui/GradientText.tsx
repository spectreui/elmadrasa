// src/components/ui/GradientText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { cn, useTheme } from '../../utils/themeUtils';

interface GradientTextProps extends TextProps {
  colors?: string[];
  className?: string;
}

export function GradientText({ 
  colors, 
  className = '', 
  children, 
  ...props 
}: GradientTextProps) {
  const theme = useTheme();
  const gradientColors = colors || theme.colors.accentGradient;

  return (
    <MaskedView
      maskElement={
        <Text className={className} {...props}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text className={cn('opacity-0', className)} {...props}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}