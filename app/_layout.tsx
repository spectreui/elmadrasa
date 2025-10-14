// app/_layout.tsx - Modified approach
import "../global.css";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Slot, Redirect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { ThemeProvider, useThemeContext } from "../src/contexts/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { linking } from '@/src/utils/linking';
import { NotificationProvider } from "@/contexts/NotificationContext";
import AppleHello from "@/components/AppleHello";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "@/components/SafeAreaView";

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

function RootRedirect() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/(auth)/login');
      } else if (user?.role) {
        router.replace(`(${user.role})/`);
      }
    }
  }, [isAuthenticated, loading, user, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}

// Simple fallback component
function IntroFallback() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>Welcome</Text>
    </View>
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
  const [animationError, setAnimationError] = useState(false);

  // Check if intro should be shown
  useEffect(() => {
    const checkIntro = async () => {
      try {
        console.log('🔍 Checking intro state...');
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

  // Handle intro completion
  const handleHelloDone = async () => {
    try {
      console.log('✅ Hello animation done, saving state...');
      await AsyncStorage.setItem("introShown", "true");
      console.log('✅ Intro state saved');
      setHelloDone(true);
    } catch (e) {
      console.error("❌ Error saving intro state:", e);
      setHelloDone(true); // Continue anyway
    }
  };

  // Safe wrapper for AppleHello
  const renderIntro = () => {
    try {
      return (
        <AppleHello
          onAnimationComplete={handleHelloDone}
          speed={1.8}
        />
      );
    } catch (error) {
      console.error('❌ Animation error:', error);
      setAnimationError(true);
      // Fallback: mark as done after a short delay
      setTimeout(() => handleHelloDone(), 1000);
      return <IntroFallback />;
    }
  };

  // Hide splash screen when ready
  useEffect(() => {
    if (loaded && (showIntro === false || helloDone || storageError || animationError)) {
      console.log('✨ Hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loaded, showIntro, helloDone, storageError, animationError]);

  // Still loading intro state
  if (showIntro === null) {
    console.log('⏳ Waiting for intro state...');
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  // Show intro animation
  if (showIntro && !helloDone && !animationError) {
    console.log('🎬 Showing intro animation...');
    return renderIntro();
  }

  // Show fallback if animation errored but we still want to show something
  if (showIntro && !helloDone && animationError) {
    return <IntroFallback />;
  }

  console.log('📱 Rendering main app...');
  // Main app
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemeWrapper>
          <AuthProvider>
            <NotificationProvider>
              <SafeAreaView>
              {/* Use Slot instead of Stack for root layout */}
              <Slot />
              </SafeAreaView>
            </NotificationProvider>
          </AuthProvider>
        </ThemeWrapper>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
