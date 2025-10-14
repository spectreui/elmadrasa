// _layout.tsx
import "../global.css";
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider, useThemeContext } from "../src/contexts/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { linking } from '@/src/utils/linking';
import { NotificationProvider } from "@/contexts/NotificationContext";
import AppleHello from "@/components/AppleHello";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeContext();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.otf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.otf'),
  });

  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [helloDone, setHelloDone] = useState(false);
  const [storageError, setStorageError] = useState(false);

  // Check if intro should be shown
  useEffect(() => {
    const checkIntro = async () => {
      try {
        console.log('🔍 Checking intro state...');
        // AsyncStorage.setItem("introShown", "true");
        const seen = await AsyncStorage.getItem("introShown");
        console.log('🔍 Intro seen:', seen);
        setShowIntro(seen !== "true");
      } catch (e) {
        console.error("❌ Error checking intro:", e);
        setStorageError(true);
        setShowIntro(false);
      }
    };
    checkIntro();
  }, []);

  // Handle font loading errors
  useEffect(() => {
    if (error) {
      console.error('❌ Font loading error:', error);
    }
  }, [error]);

  // Handle intro completion
  const handleHelloDone = async () => {
    try {
      console.log('✅ Hello animation done, saving state...');
      await AsyncStorage.setItem("introShown", "true");
      console.log('✅ Intro state saved');
    } catch (e) {
      console.error("❌ Error saving intro state:", e);
    }
    setHelloDone(true);
  };

  // Hide splash screen when ready
  useEffect(() => {
    if (loaded && (showIntro === false || helloDone || storageError)) {
      console.log('✨ Hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loaded, showIntro, helloDone, storageError]);

  // Error state
  if (storageError) {
    console.log('⚠️ Storage error, showing fallback');
    useEffect(() => {
      const timer = setTimeout(() => {
        setHelloDone(true);
      }, 1000);
      return () => clearTimeout(timer);
    }, []);

    if (!helloDone) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000' }} />
      );
    }
  }

  // Still loading intro state
  if (showIntro === null) {
    console.log('⏳ Waiting for intro state...');
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }} />
    );
  }

  // Show intro animation
  if (showIntro && !helloDone) {
    console.log('🎬 Showing intro animation...');
    return (
      <AppleHello
        onAnimationComplete={handleHelloDone}
        speed={1.8}
      />
    );
  }

  console.log('📱 Rendering main app...');
  // Main app
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemeWrapper>
          <AuthProvider>
            <NotificationProvider>
              <Stack
                screenOptions={{ headerShown: false }}
                linking={linking}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(student)" />
                <Stack.Screen name="(teacher)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="index" />
              </Stack>
            </NotificationProvider>
          </AuthProvider>
        </ThemeWrapper>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
