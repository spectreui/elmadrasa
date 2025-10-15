// app/_layout.tsx - Simplified version
import "../global.css";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { ThemeProvider, useThemeContext } from "../src/contexts/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { NotificationProvider } from "@/contexts/NotificationContext";
import AppleHello from "@/components/AppleHello";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "@/components/SafeAreaView";

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

// Simple auth check for protected routes (optional)
function AuthCheck() {
  // const {isAuthenticated, user} = useAuth()
  // if (!isAuthenticated || !user?.role) {
  //   return <Redirect href="/(auth)/login" />;
  // }
  return null
}

function IntroFallback() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "white", fontSize: 24 }}>Welcome</Text>
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    "Inter-Regular": require("@/assets/fonts/Inter-Regular.otf"),
    "Inter-SemiBold": require("@/assets/fonts/Inter-SemiBold.otf"),
  });

  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [helloDone, setHelloDone] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [animationError, setAnimationError] = useState(false);

  useEffect(() => {
    const checkIntro = async () => {
      try {
        const seen = await AsyncStorage.getItem("introShown");
        setShowIntro(seen !== "true");
      } catch (e) {
        console.error("❌ Error checking intro:", e);
        setStorageError(true);
        setShowIntro(false);
      }
    };
    checkIntro();
  }, []);

  const handleHelloDone = async () => {
    try {
      await AsyncStorage.setItem("introShown", "true");
      setHelloDone(true);
    } catch (e) {
      console.error("❌ Error saving intro state:", e);
      setHelloDone(true);
    }
  };

  const renderIntro = () => {
    try {
      return <AppleHello onAnimationComplete={handleHelloDone} speed={1.8} />;
    } catch (error) {
      console.error("❌ Animation error:", error);
      setAnimationError(true);
      setTimeout(() => handleHelloDone(), 1000);
      return <IntroFallback />;
    }
  };

  useEffect(() => {
    if (loaded && (showIntro === false || helloDone || storageError || animationError)) {
      SplashScreen.hideAsync();
    }
  }, [loaded, showIntro, helloDone, storageError, animationError]);

  if (showIntro === null) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  if (showIntro && !helloDone && !animationError) {
    return renderIntro();
  }

  if (showIntro && !helloDone && animationError) {
    return <IntroFallback />;
  }

  // ✅ Main App
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemeWrapper>
          <AuthProvider>
            <NotificationProvider>
              <SafeAreaView>
                {/* <AuthCheck /> */}
                <Slot />
              </SafeAreaView>
            </NotificationProvider>
          </AuthProvider>
        </ThemeWrapper>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
