import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface LiquidGlassProps {
  children: React.ReactNode;
  intensity?: number;
  blur?: number;
  borderRadius?: number;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  animate?: boolean;
  animationSpeed?: number;
  colors?: string[];
}

export default function LiquidGlass({
  children,
  intensity = 0.1,
  blur = Platform.OS === 'ios' ? 20 : 10,
  borderRadius = 20,
  borderWidth = 1,
  style,
  contentStyle,
  animate = true,
  animationSpeed = 1,
  colors = [
    'rgba(255, 255, 255, 0.2)',
    'rgba(255, 255, 255, 0.1)',
    'rgba(255, 255, 255, 0.05)',
  ],
}: LiquidGlassProps) {
  const animation = useSharedValue(0);
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    if (animate) {
      // Main liquid animation
      animation.value = withRepeat(
        withTiming(1, {
          duration: 8000 / animationSpeed,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      );

      // Subtle pulse animation
      pulse.value = withRepeat(
        withDelay(
          2000,
          withTiming(1, {
            duration: 3000 / animationSpeed,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      );
    }
  }, [animate, animationSpeed]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!animate) return {};

    return {
      transform: [
        {
          translateX: Math.sin(animation.value * Math.PI * 2) * 2,
        },
        {
          translateY: Math.cos(animation.value * Math.PI * 2) * 1.5,
        },
        {
          scale: 1 + pulse.value * 0.02,
        },
      ],
      opacity: 0.7 + pulse.value * 0.1,
    };
  });

  const animatedBorderStyle = useAnimatedStyle(() => {
    if (!animate) return {};

    return {
      borderColor: `rgba(255, 255, 255, ${0.3 + pulse.value * 0.2})`,
    };
  });

  return (
    <View style={[styles.container, style]}>
      {/* Background Blur */}
      <BlurView
        intensity={blur}
        style={[
          styles.glass,
          {
            borderRadius,
            borderWidth,
          },
        ]}
        tint="light"
      >
        {/* Animated Gradient Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            animatedStyle,
            {
              borderRadius: borderRadius - 1,
              overflow: 'hidden',
            },
          ]}
        >
          <LinearGradient
            colors={colors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Animated Border */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            animatedBorderStyle,
            {
              borderRadius,
              borderWidth,
              pointerEvents: 'none',
            },
          ]}
        />

        {/* Content */}
        <View style={[styles.content, contentStyle]}>{children}</View>
      </BlurView>

      {/* Reflection Highlights */}
      <View
        style={[
          styles.highlight,
          {
            top: 10,
            left: 10,
            borderRadius: borderRadius / 2,
          },
        ]}
      />
      <View
        style={[
          styles.highlight,
          {
            bottom: 10,
            right: 10,
            borderRadius: borderRadius / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  glass: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.5)',
      android: 'rgba(255, 255, 255, 0.15)',
      web: 'rgba(255, 255, 255, 0.1)',
    }),
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    position: 'relative',
    zIndex: 10,
  },
  highlight: {
    position: 'absolute',
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 5,
    pointerEvents: 'none',
  },
});