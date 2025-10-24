// app/_layout.tsx
import "../global.css";
import React, { useEffect, useState } from "react";
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

// ✅ Make sure the splash screen stays until fonts + intro are ready
SplashScreen.preventAutoHideAsync().catch(() => { });

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeContext();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </>
  );
}

// ✅ Only register SW in web environment
function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    console.log('🛠️ Starting service worker registration...');

    // Don't wait for load event - register immediately
    navigator.serviceWorker
      .register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      })
      .then((registration) => {
        console.log('✅ Service Worker registered successfully!');
        console.log('Scope:', registration.scope);
        console.log('State:', registration.active?.state);

        // Check if it becomes active
        if (registration.installing) {
          registration.installing.addEventListener('statechange', (event) => {
            console.log('SW state changed:', event.target.state);
          });
        }

        // Force activation
        registration.update();
      })
      .catch((error) => {
        console.error('❌ Service Worker registration FAILED:', error);
        console.log('Full error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      });
  } else {
    console.log('❌ Service Worker not supported in this browser');
  }
}

// ✅ PWA installation handler
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("PWA install outcome:", outcome);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, installPWA };
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
  const { isInstallable, installPWA } = usePWAInstall();

  // ✅ Register service worker on web only
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('🌐 Web platform detected, registering service worker...');
      registerServiceWorker(); // ← THIS IS MISSING!

      console.log('🛠️ Injecting PWA meta tags...');

      // Remove any existing manifests
      document.querySelectorAll('link[rel="manifest"]').forEach(el => el.remove());

      // Inject manifest with cache busting
      const manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json?' + Date.now(); // Cache bust
      document.head.appendChild(manifestLink);

      // Test if manifest is accessible
      fetch('/manifest.json')
        .then(response => {
          console.log('📄 Manifest file status:', response.status);
          if (response.ok) {
            console.log('✅ Manifest is accessible');
          }
        })
        .catch(err => {
          console.error('❌ Manifest not accessible:', err);
        });

      // Add theme color
      const themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      themeColor.content = '#007AFF';
      document.head.appendChild(themeColor);

      // Add mobile viewport
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1, minimum-scale=1, user-scalable=no';
      document.head.appendChild(viewport);
    }
  }, []);

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
        await AsyncStorage.setItem("introShown", 'true');
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
                  <SmartBanner
                    appName="El Madrasa"
                    appScheme="elmadrasa"
                    currentPath={pathname}
                  />
                  <SafeAreaView>
                    <FancyTabBarProvider>
                      {/* ✅ Show install prompt for PWA */}
                      {isInstallable && Platform.OS === "web" && (
                        <View
                          style={{
                            backgroundColor: "#007AFF",
                            padding: 10,
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexDirection: "row",
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              flex: 1,
                              fontSize: 14,
                            }}
                          >
                            Install El Madrasa app for a better experience
                          </Text>
                          <button
                            onClick={installPWA}
                            style={{
                              backgroundColor: "white",
                              color: "#007AFF",
                              border: "none",
                              padding: "8px 12px",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            Install
                          </button>
                        </View>
                      )}
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
