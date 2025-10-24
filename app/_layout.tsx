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

// ✅ PWA installation handler
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [userEngaged, setUserEngaged] = useState(false);
  const [engagementTime, setEngagementTime] = useState(0);
  const mountedRef = useRef(true);

  // Track user engagement
  useEffect(() => {
    if (typeof window === "undefined" || !mountedRef.current) return;

    let engagementTimer: NodeJS.Timeout;
    const startTime = Date.now();
    
    engagementTimer = setInterval(() => {
      if (!mountedRef.current) return;
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      setEngagementTime(timeSpent);
      
      // Show prompt after 30 seconds OR if user engaged for 10+ seconds AND we have prompt
      if (timeSpent >= 30 || (userEngaged && timeSpent >= 10 && deferredPrompt)) {
        if (deferredPrompt && mountedRef.current) {
          console.log(`⏰ ${timeSpent >= 30 ? '30+ seconds' : 'User engaged 10+ seconds'} - showing install prompt`);
          setIsInstallable(true);
        }
      }
    }, 1000);

    const engagementEvents = ['click', 'scroll', 'keydown', 'touchstart', 'mousemove'];
    const handleEngagement = () => {
      if (!userEngaged && mountedRef.current) {
        console.log('🎯 User engaged with the app');
        setUserEngaged(true);
      }
    };

    engagementEvents.forEach(event => {
      document.addEventListener(event, handleEngagement, { passive: true });
    });

    return () => {
      clearInterval(engagementTimer);
      engagementEvents.forEach(event => {
        document.removeEventListener(event, handleEngagement);
      });
    };
  }, [deferredPrompt, userEngaged]);

  // Expose globally for manual testing (only in development)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      window.setDeferredPrompt = setDeferredPrompt;
      window.setIsInstallable = setIsInstallable;
      window.getPWAState = () => ({
        deferredPrompt: !!deferredPrompt,
        isInstallable,
        hasSW: !!navigator.serviceWorker?.controller,
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        engagementTime,
        userEngaged
      });
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.setDeferredPrompt = undefined as any;
        window.setIsInstallable = undefined as any;
        window.getPWAState = undefined as any;
      }
    };
  }, [deferredPrompt, isInstallable, engagementTime, userEngaged]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      console.log('📱 beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Immediately show if user already engaged
      if (userEngaged) {
        console.log('🚀 User already engaged - showing prompt immediately');
        setIsInstallable(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    window.addEventListener('appinstalled', () => {
      console.log('🎉 App was installed');
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [userEngaged]);

  const installPWA = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return;
    }
    
    console.log('📲 Triggering install prompt...', deferredPrompt);
    
    if (typeof deferredPrompt.prompt === 'function') {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else {
      console.warn('❌ deferredPrompt.prompt is not a function:', deferredPrompt);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { isInstallable, installPWA, deferredPrompt };
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

// ✅ Install Prompt Component
function PWAInstallPrompt() {
  const { colors } = useThemeContext();
  const { isInstallable, installPWA } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <View
      style={{
        backgroundColor: colors.primary || '#007AFF',
        padding: 12,
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row",
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text
        style={{
          color: "white",
          flex: 1,
          fontSize: 14,
          fontWeight: "500",
          marginRight: 12,
        }}
      >
        Install El Madrasa app for a better experience
      </Text>
      <button
        onClick={installPWA}
        style={{
          backgroundColor: "white",
          color: colors.primary || '#007AFF',
          border: "none",
          padding: "8px 16px",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 14,
          fontWeight: "600",
          whiteSpace: "nowrap",
        }}
      >
        Install
      </button>
    </View>
  );
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
