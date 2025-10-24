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

// ✅ PWA Theme Hook - Uses theme context
function usePWATheme() {
  const { colors, isDark } = useThemeContext();
  const [themeColor, setThemeColor] = useState('#007AFF');

  useEffect(() => {
    // Update theme color based on current theme
    if (Platform.OS === 'web') {
      const newThemeColor = colors.background || (isDark ? '#0F172A' : '#ffffff');
      setThemeColor(newThemeColor);
      
      // Update meta tag
      let themeMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeMeta) {
        themeMeta = document.createElement('meta');
        themeMeta.setAttribute('name', 'theme-color');
        document.head.appendChild(themeMeta);
      }
      themeMeta.setAttribute('content', newThemeColor);
      
      console.log('🎨 Updated PWA theme color:', newThemeColor);
    }
  }, [colors.background, isDark]);

  return themeColor;
}

// ✅ Service Worker Registration - Only in Production
function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track user engagement
    const engagementEvents = ['click', 'scroll', 'keydown', 'touchstart'];
    const handleEngagement = () => {
      if (!userEngaged) {
        console.log('🎯 User engaged with the app');
        setUserEngaged(true);
        // Remove listeners after first engagement
        engagementEvents.forEach(event => {
          document.removeEventListener(event, handleEngagement);
        });
      }
    };

    engagementEvents.forEach(event => {
      document.addEventListener(event, handleEngagement, { once: true });
    });

    const handler = (e: any) => {
      console.log('📱 beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show immediately if user is engaged
      if (userEngaged) {
        setIsInstallable(true);
      } else {
        // Wait for engagement, then show after delay
        const checkEngagement = setInterval(() => {
          if (userEngaged) {
            setIsInstallable(true);
            clearInterval(checkEngagement);
          }
        }, 1000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    window.addEventListener('appinstalled', (evt) => {
      console.log('🎉 App was installed');
      setIsInstallable(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      engagementEvents.forEach(event => {
        document.removeEventListener(event, handleEngagement);
      });
    };
  }, [userEngaged]);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    
    console.log('📲 Triggering install prompt...');
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, installPWA };
}

// ✅ PWA Setup Component - Uses theme context
function PWASetup() {
  const { colors, isDark } = useThemeContext();
  
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('🌐 Setting up PWA with theme...');
      
      // Remove any existing manifests
      document.querySelectorAll('link[rel="manifest"]').forEach(el => el.remove());
      
      // Create new manifest with current theme
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

      // Register service worker (will auto-skip in development)
      registerServiceWorker();

      console.log('✅ PWA setup complete with theme:', themeColor);
    }
  }, [colors.background, isDark]); // Re-run when theme changes

  return null; // This component doesn't render anything
}

// ✅ PWA Debug Component
function PWADebug() {
  const { colors } = useThemeContext();
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const checkAll = async () => {
      const checks = {
        hasSW: 'serviceWorker' in navigator,
        isHTTPS: location.protocol === 'https:',
        isLocalhost: false,
        manifestExists: false,
        swExists: false,
        swRegistered: false,
        themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') || 'not set'
      };
      
      try {
        const manifestResp = await fetch('/manifest.json');
        checks.manifestExists = manifestResp.ok;
      } catch (e) {}
      
      try {
        const swResp = await fetch('/service-worker.js');
        checks.swExists = swResp.ok;
      } catch (e) {}
      
      const reg = await navigator.serviceWorker.getRegistration();
      checks.swRegistered = !!reg;
      
      setDebugInfo(checks);
    };
    
    checkAll();
  }, [colors.background]); // Update when theme changes
  
  if (Platform.OS !== 'web') return null;
  
  return (
    <div style={{
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.9)', 
      color: 'white', 
      padding: 10, 
      fontSize: 12, 
      zIndex: 9999,
      maxWidth: 300,
      borderRadius: 8,
      border: '1px solid #333'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 5 }}>PWA Status:</div>
      <div>Theme: <span style={{ color: '#4ade80' }}>{debugInfo.themeColor}</span></div>
      <div>SW Support: <span style={{ color: debugInfo.hasSW ? '#4ade80' : '#f87171' }}>{debugInfo.hasSW ? '✅' : '❌'}</span></div>
      <div>HTTPS: <span style={{ color: debugInfo.isHTTPS ? '#4ade80' : '#f87171' }}>{debugInfo.isHTTPS ? '✅' : '❌'}</span></div>
      <div>Manifest: <span style={{ color: debugInfo.manifestExists ? '#4ade80' : '#f87171' }}>{debugInfo.manifestExists ? '✅' : '❌'}</span></div>
      <div>SW Registered: <span style={{ color: debugInfo.swRegistered ? '#4ade80' : '#f87171' }}>{debugInfo.swRegistered ? '✅' : '❌'}</span></div>
    </div>
  );
}

// ✅ Install Prompt Component - Uses theme context
function PWAInstallPrompt() {
  const { colors } = useThemeContext();
  const { isInstallable, installPWA } = usePWAInstall();

  if (!isInstallable || Platform.OS !== "web") return null;

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
          background: "white",
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
      {/* PWA Setup - uses theme context */}
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
                      {/* ✅ PWA Debug Component - Remove in production */}
                      <PWADebug />
                      
                      {/* ✅ PWA Install Prompt - Uses theme colors */}
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