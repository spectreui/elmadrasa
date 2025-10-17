// components/LiquidGlassTabBar.tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useThemeContext } from '@/contexts/ThemeContext';

const Blur = ({ children }: { children: React.ReactNode }) => {
    const isNative = (Platform.OS === 'ios' || Platform.OS === 'android');
    if (isNative) {
        return (
            <>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                {children}
            </>
        )
    }
}

const LiquidGlassTabBar = (props : any) => {
    const { isDark } = useThemeContext();
    // Web-compatible glass effect styles
    const webGlassStyle = Platform.select({
        web: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25' : 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        },
        ios: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25' : 'rgba(255, 255, 255, 0.25)',
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
            borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(100, 98, 98, 0.18)' ,
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
                    intensity={80}
                    tint="light"
                    style={StyleSheet.absoluteFill}
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