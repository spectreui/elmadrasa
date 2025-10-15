// src/components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { cn, useTheme } from '../../utils/themeUtils';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: string;
  className?: string;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const theme = useTheme();

  const variants = {
    primary: 'bg-blue-500 border border-blue-500',
    secondary: 'bg-gray-500 border border-gray-500',
    outline: 'border-2 border-blue-500 bg-transparent',
    ghost: 'bg-transparent',
    destructive: 'bg-red-500 border border-red-500',
  };

  const sizes = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textVariants = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-blue-500 dark:text-blue-400',
    ghost: `${theme.colors.text.primary}`,
    destructive: 'text-white',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <TouchableOpacity
      className={cn(
        'rounded-2xl flex-row items-center justify-center',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <Text className={cn('font-semibold', textVariants[variant], textSizes[size])}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}