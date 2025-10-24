// components/LiquidGlassTabBar.tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useThemeContext } from '@/contexts/ThemeContext';

const LiquidGlassTabBar = (props: any) => {
    const { isDark } = useThemeContext();
    // Web-compatible glass effect styles
    const blurIntensity = Platform.select({
        ios: isDark ? 85 : 70,
        android: isDark ? 60 : 30,
    });
    const webGlassStyle = Platform.select({
        web: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        },
        android: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.0)' : 'rgba(255, 255, 255, 0.0)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        },
        ios: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }
    });
    const styles = StyleSheet.create({
        glassContainer: {
            position: 'absolute',
            bottom: 10,
            left: 15,
            right: 15,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.19)' : 'rgba(100, 98, 98, 0.19)',
            overflow: 'hidden',
            borderRadius: 50,
        },
        liquidOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: isDark ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none',
        },
    });

    return (
        <View style={[styles.glassContainer, webGlassStyle]}>
            {/* Native BlurView - won't affect web */}
            {Platform.OS !== 'web' && (
                <BlurView
                    intensity={blurIntensity}
                    tint={isDark ? "dark" : "light"}
                    style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
                    experimentalBlurMethod='dimezisBlurView'
                />
            )}

            {/* Liquid gradient overlay for enhanced glass effect */}
            <View style={styles.liquidOverlay} />

            {/* Main tab bar content */}
            <BottomTabBar {...props} />
        </View>
    );
};

export default LiquidGlassTabBar;