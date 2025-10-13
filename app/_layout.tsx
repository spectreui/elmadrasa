import "../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider, useThemeContext } from "../src/contexts/ThemeContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { linking } from '@/src/utils/linking';

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
    'Inter-Black': require('@/assets/fonts/Inter-Black.otf'),
    'Inter-Bold': require('@/assets/fonts/Inter-Bold.otf'),
    'Inter-ExtraBold': require('@/assets/fonts/Inter-ExtraBold.otf'),
    'Inter-ExtraLight': require('@/assets/fonts/Inter-ExtraLight.otf'),
    'Inter-Light': require('@/assets/fonts/Inter-Light.otf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.otf'),
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.otf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.otf'),
    'Inter-Thin': require('@/assets/fonts/Inter-Thin.otf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Handle deep links
  useEffect(() => {
    // Handle initial URL when app is opened
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('Initial URL:', initialUrl);
        // Handle the URL using expo-router's linking
        // The linking config will automatically handle navigation
      }
    };

    getUrlAsync();

    // Listen for URL changes while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('URL changed:', event.url);
      // expo-router will automatically handle this through the linking config
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!loaded) {
    return null;
  }
  
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedSafeAreaView>
          <ThemeWrapper>
            <AuthProvider>
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
            </AuthProvider>
          </ThemeWrapper>
        </ThemedSafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedSafeAreaView({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeContext();
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1C1C1E" : "#fff" },
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
