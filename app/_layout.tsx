// app/_layout.tsx - Fixed version
import "../global.css";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Platform } from "react-native";
import { Slot, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { ThemeProvider, useThemeContext } from "../src/contexts/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { NotificationProvider } from "@/contexts/NotificationContext";
import AppleHello from "@/components/AppleHello";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "@/components/SafeAreaView";
import { apiService } from "@/src/services/api";
import SmartBanner from "@/components/SmartBanner";
import Constants from "expo-constants";
import { setUniversalPromptFunction } from "@/components/UniversalAlert";
import { UniversalPromptProvider, useUniversalPrompt } from "@/components/UniversalPrompt";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Keep splash screen until ready
SplashScreen.preventAutoHideAsync();

// Move PromptSetup component BEFORE the RootLayout
function PromptSetup() {
  const { showUniversalPrompt } = useUniversalPrompt();

  React.useEffect(() => {
    setUniversalPromptFunction(showUniversalPrompt);
  }, [showUniversalPrompt]);

  return null;
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

// Simple fallback if animation fails
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
  const [loaded, error] = useFonts({
    "Inter-Regular": require("@/assets/fonts/Inter-Regular.otf"),
    "Inter-SemiBold": require("@/assets/fonts/Inter-SemiBold.otf"),
  });

  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [helloDone, setHelloDone] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [animationError, setAnimationError] = useState(false);
  const pathname = usePathname();

  // ✅ Pre-warm token (to avoid unauthorized flickers)
  useEffect(() => {
    AsyncStorage.setItem("introShown", "true");
    (async () => {
      await apiService.validateToken();
    })();
  }, []);

  // ✅ Check if intro was seen
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
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <ThemeWrapper>
              <UniversalPromptProvider>
                <PromptSetup />
                <NotificationProvider>
                  <SmartBanner
                    appName="El Madrasa"
                    appScheme="elmadrasa" // Your app's custom scheme from app.json
                    currentPath={pathname}
                  />
                  <SafeAreaView>
                    <Slot />
                  </SafeAreaView>
                </NotificationProvider>
              </UniversalPromptProvider>
            </ThemeWrapper>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}