// app/_layout.tsx
import "../global.css";
import React, { useEffect, useState, useRef } from "react";
import { View, Text, Platform } from "react-native";
import { Slot, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider, useThemeContext } from "../src/contexts/ThemeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { NotificationProvider } from "@/contexts/NotificationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "@/components/SafeAreaView";
import { apiService } from "@/src/services/api";
import SmartBanner from "@/components/SmartBanner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AlertProvider } from "@/components/Alert";
import ElmadrasaAnimation from "@/components/AppleHello";
import { FancyTabBarProvider } from "@/contexts/TabBarContext";
import { PageTitleHandler } from '@/components/PageTitleHandler';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

// ✅ Prevent splash screen auto-hide
SplashScreen.preventAutoHideAsync().catch(() => { });

// ✅ Service Worker Registration
function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    // const isLocalhost = Boolean(
    //   window.location.hostname === 'localhost' ||
    //   window.location.hostname === '[::1]' ||
    //   window.location.hostname.match(
    //     /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    //   )
    // );
    const isLocalhost = false;
    
    if (!isLocalhost) {
      console.log('🛠️ Starting service worker registration...');
      
      navigator.serviceWorker
        .register('/service-worker.js', { 
          scope: '/',
          updateViaCache: 'none'
        })
        .then((registration) => {
          console.log('✅ Service Worker registered successfully!');
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    } else {
      console.log('🚫 Service Worker disabled in development mode');
    }
  }
}

// Add TypeScript declarations
declare global {
  interface Window {
    setDeferredPrompt?: (prompt: any) => void;
    setIsInstallable?: (installable: boolean) => void;
    getPWAState?: () => any;
  }
}

// ✅ PWA Setup Component
function PWASetup() {
  const { colors, isDark } = useThemeContext();
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web' && !hasRegistered.current) {
      console.log('🌐 Setting up PWA with theme...');
      
      // Remove existing manifests
      document.querySelectorAll('link[rel="manifest"]').forEach(el => el.remove());
      
      // Create new manifest
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);

      // Update theme color meta tag
      const themeColor = colors.background || (isDark ? '#0F172A' : '#ffffff');
      let themeMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeMeta) {
        themeMeta = document.createElement('meta');
        themeMeta.setAttribute('name', 'theme-color');
        document.head.appendChild(themeMeta);
      }
      themeMeta.setAttribute('content', themeColor);

      // Add mobile viewport if not exists
      if (!document.querySelector('meta[name="viewport"]')) {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1, minimum-scale=1, user-scalable=no';
        document.head.appendChild(viewport);
      }

      // Register service worker
      registerServiceWorker();

      console.log('✅ PWA setup complete with theme:', themeColor);
      hasRegistered.current = true;
    }
  }, [colors.background, isDark]);

  return null;
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeContext();
  
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <PWASetup />
      {children}
    </>
  );
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
    "Sf-Arabic-semibold": require("@/assets/fonts/SF-Arabic-semibold.ttf"),
    "Sf-Arabic-Rounded": require("@/assets/fonts/SF-Arabic-Rounded.ttf"),
    "Sf-Pro-Regular": require("@/assets/fonts/SF-Pro-Regular.otf"),
    "Sf-Pro-Bold": require("@/assets/fonts/SF-Pro-Bold.otf"),
    "Sf-Pro-Black": require("@/assets/fonts/SF-Pro-Black.otf"),
    "Sf-Pro-Medium": require("@/assets/fonts/SF-Pro-Medium.otf"),
  });

  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [helloDone, setHelloDone] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [animationError, setAnimationError] = useState(false);
  const pathname = usePathname();

  // ✅ Hide splash once app ready
  useEffect(() => {
    if (loaded && (showIntro === false || helloDone)) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [loaded, showIntro, helloDone]);

  // ✅ Pre-warm token
  useEffect(() => {
    apiService.validateToken().catch(() => { });
  }, []);

  // ✅ Check intro state
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
    } catch (e) {
      console.warn("❌ Error saving intro state:", e);
    } finally {
      setHelloDone(true);
    }
  };

  const renderIntro = () => {
    try {
      return (
        <ElmadrasaAnimation onAnimationComplete={handleHelloDone} speed={2} />
      );
    } catch (error) {
      console.error("❌ Animation error:", error);
      setAnimationError(true);
      setTimeout(() => handleHelloDone(), 1000);
      return <IntroFallback />;
    }
  };

  if (showIntro === null) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  if (showIntro && !helloDone) {
    return animationError ? <IntroFallback /> : renderIntro();
  }

  // ✅ Main App
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <ThemeWrapper>
              <AlertProvider>
                <NotificationProvider>
                  <PageTitleHandler />
                  <SmartBanner
                    appName="El Madrasa"
                    appScheme="elmadrasa"
                    currentPath={pathname}
                  />
                  <SafeAreaView>
                    <FancyTabBarProvider>
                      <PWAInstallPrompt />
                      <Slot />
                    </FancyTabBarProvider>
                  </SafeAreaView>
                </NotificationProvider>
              </AlertProvider>
            </ThemeWrapper>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
