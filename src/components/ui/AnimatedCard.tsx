// src/components/ui/AnimatedCard.tsx
import React, { useEffect } from 'react';
import { View, ViewProps, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  withTiming 
} from 'react-native-reanimated';
import { cn, useTheme } from '../../utils/themeUtils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedCardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'glass';
  intensity?: number;
  onPress?: () => void;
  className?: string;
}

export function AnimatedCard({ 
  variant = 'default', 
  intensity = 0,
  onPress,
  className = '', 
  children, 
  ...props 
}: AnimatedCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const variants = {
    default: `${theme.colors.backgroundElevated} border ${theme.colors.border} rounded-3xl`,
    elevated: `${theme.colors.backgroundElevated} rounded-3xl shadow-lg`,
    glass: `bg-white/10 dark:bg-black/10 rounded-3xl backdrop-blur-md border border-white/20`,
  };

  const content = (
    <Animated.View 
      style={[animatedStyle, theme.shadows.lg]}
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}