// src/components/ui/Card.tsx
import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn, useTheme } from '../../utils/themeUtils';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  const theme = useTheme();
  
  const variants = {
    default: `${theme.colors.background} ${theme.colors.border} border rounded-2xl`,
    elevated: `${theme.colors.backgroundElevated} rounded-2xl`,
    outlined: `${theme.colors.background} border-2 ${theme.colors.border} rounded-2xl`,
  };

  return (
    <View className={cn(variants[variant], className)} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ className = '', children, ...props }: ViewProps) {
  return (
    <View className={cn('p-6 pb-4', className)} {...props}>
      {children}
    </View>
  );
}

export function CardContent({ className = '', children, ...props }: ViewProps) {
  return (
    <View className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </View>
  );
}