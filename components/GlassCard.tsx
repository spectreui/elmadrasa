// components/GlassCard.tsx
import React from 'react';
import { View, Pressable } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  onPress,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'p-3 rounded-glass',
    md: 'p-4 rounded-glass',
    lg: 'p-5 rounded-glass-lg',
  };

  const variantClasses = {
    default: 'bg-glass-light dark:bg-glass-dark border border-glass-border backdrop-blur-glass',
    elevated: 'bg-glass-light dark:bg-glass-dark border border-glass-border backdrop-blur-glass shadow-glass-elevated',
    filled: 'bg-glass-light/20 dark:bg-glass-dark/20 border border-glass-border backdrop-blur-glass-lg',
  };

  const cardClass = `${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if (onPress) {
    return (
      <Pressable 
        className={cardClass}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={cardClass}>
      {children}
    </View>
  );
};