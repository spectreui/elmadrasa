// src/components/ui/BlurView.tsx
import React from 'react';
import { BlurView as ExpoBlurView } from 'expo-blur';
import { ViewProps } from 'react-native';
import { cn, useTheme } from '../../utils/themeUtils';

interface BlurViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  className?: string;
}

export function BlurView({ 
  intensity = 80, 
  tint = 'default', 
  className = '', 
  children, 
  ...props 
}: BlurViewProps) {
  const theme = useTheme();
  
  return (
    <ExpoBlurView
      intensity={intensity}
      tint={tint}
      className={cn('rounded-3xl overflow-hidden', className)}
      {...props}
    >
      {children}
    </ExpoBlurView>
  );
}