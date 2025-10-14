import "../global.css";
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider, useThemeContext } from "../src/contexts/ThemeContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { linking } from "@/src/utils/linking";
import { NotificationProvider } from "@/contexts/NotificationContext";
import AppleHello from "@/components/AppleHello";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ⬅️ add this

// Prevent splash auto-hide
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [helloDone, setHelloDone] = useState(false);
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  const [loaded, error] = useFonts({
    "Inter-Regular": require("@/assets/fonts/Inter-Regular.otf"),
    "Inter-SemiBold": require("@/assets/fonts/Inter-SemiBold.otf"),
  });

  // 🧠 Check AsyncStorage on mount
  useEffect(() => {
    const checkIntro = async () => {
      try {
        const seen = await AsyncStorage.getItem("introShown");
        setShowIntro(!seen);
      } catch (e) {
        console.warn("Error checking introShown:", e);
        setShowIntro(false);
      }
    };
    checkIntro();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Hide splash only after everything (fonts + hello) is ready
  useEffect(() => {
    if (loaded && helloDone) {
      SplashScreen.hideAsync();
    }
  }, [loaded, helloDone]);

  // Handle animation complete
  const handleHelloDone = async () => {
    try {
      await AsyncStorage.setItem("introShown", "true");
    } catch (e) {
      console.warn("Error saving introShown:", e);
    }
    setHelloDone(true);
  };

  // Still checking AsyncStorage? (null = unknown yet)
  if (showIntro === null) return null;

  // First-time intro
  if (showIntro && !helloDone) {
    return (
      <AppleHello
        speed={1.8}
        onAnimationComplete={handleHelloDone}
      />
    );
  }

  // Normal app
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedSafeAreaView>
          <ThemeWrapper>
            <AuthProvider>
              <NotificationProvider>
                <Stack screenOptions={{ headerShown: false }} linking={linking}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(student)" />
                  <Stack.Screen name="(teacher)" />
                  <Stack.Screen name="(admin)" />
                  <Stack.Screen name="index" />
                </Stack>
              </NotificationProvider>
            </AuthProvider>
          </ThemeWrapper>
        </ThemedSafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeContext();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </>
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
  container: { flex: 1 },
});
