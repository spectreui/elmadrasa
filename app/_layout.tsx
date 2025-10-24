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
  const [engagementTime, setEngagementTime] = useState(0);

  // Track user engagement
  useEffect(() => {
    if (typeof window === "undefined") return;

    let engagementTimer: NodeJS.Timeout;
    const startTime = Date.now();
    
    // Update engagement time every second
    engagementTimer = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      setEngagementTime(timeSpent);
      
      // Auto-show prompt after 30 seconds of engagement
      if (timeSpent >= 30 && deferredPrompt && !isInstallable) {
        console.log('⏰ 30+ seconds engaged - showing install prompt');
        setIsInstallable(true);
      }
    }, 1000);

    // Track user interactions
    const engagementEvents = ['click', 'scroll', 'keydown', 'touchstart', 'mousemove'];
    const handleEngagement = () => {
      if (!userEngaged) {
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
  }, [deferredPrompt, isInstallable, userEngaged]);

  // Expose these globally for manual testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
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

    const handler = (e: any) => {
      console.log('📱 beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Auto-show if user is already engaged, otherwise wait
      if (userEngaged && engagementTime >= 10) {
        console.log('🚀 User engaged - showing prompt immediately');
        setIsInstallable(true);
      } else {
        console.log('⏳ Waiting for user engagement...');
        // Will be shown by engagement timer
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    window.addEventListener('appinstalled', (evt) => {
      console.log('🎉 App was installed');
      setIsInstallable(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [userEngaged, engagementTime]);

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
    } else {
      console.warn('❌ deferredPrompt.prompt is not a function:', deferredPrompt);
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, installPWA };
}

// Add TypeScript declarations
declare global {
  interface Window {
    setDeferredPrompt?: (prompt: any) => void;
    setIsInstallable?: (installable: boolean) => void;
    getPWAState?: () => any;
  }
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
      const state = window.getPWAState?.() || {};
      const checks = {
        hasSW: 'serviceWorker' in navigator,
        isHTTPS: location.protocol === 'https:',
        manifestExists: false,
        swRegistered: false,
        themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') || 'not set',
        engagementTime: state.engagementTime || 0,
        userEngaged: state.userEngaged || false,
        deferredPrompt: state.deferredPrompt || false,
        isInstallable: state.isInstallable || false
      };
      
      try {
        const manifestResp = await fetch('/manifest.json');
        checks.manifestExists = manifestResp.ok;
      } catch (e) {}
      
      const reg = await navigator.serviceWorker.getRegistration();
      checks.swRegistered = !!reg;
      
      setDebugInfo(checks);
    };
    
    // Update more frequently to show engagement progress
    const interval = setInterval(checkAll, 2000);
    checkAll();
    
    return () => clearInterval(interval);
  }, [colors.background]);
  
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
      maxWidth: 320,
      borderRadius: 8,
      border: '1px solid #333'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 5 }}>PWA Status:</div>
      <div>Engagement: <span style={{ color: debugInfo.engagementTime >= 30 ? '#4ade80' : '#fbbf24' }}>{debugInfo.engagementTime}s</span></div>
      <div>User Engaged: <span style={{ color: debugInfo.userEngaged ? '#4ade80' : '#f87171' }}>{debugInfo.userEngaged ? '✅' : '❌'}</span></div>
      <div>Prompt Ready: <span style={{ color: debugInfo.deferredPrompt ? '#4ade80' : '#f87171' }}>{debugInfo.deferredPrompt ? '✅' : '❌'}</span></div>
      <div>Showing: <span style={{ color: debugInfo.isInstallable ? '#4ade80' : '#f87171' }}>{debugInfo.isInstallable ? '✅' : '❌'}</span></div>
      <div>SW: <span style={{ color: debugInfo.hasSW ? '#4ade80' : '#f87171' }}>{debugInfo.hasSW ? '✅' : '❌'}</span></div>
      <div>Manifest: <span style={{ color: debugInfo.manifestExists ? '#4ade80' : '#f87171' }}>{debugInfo.manifestExists ? '✅' : '❌'}</span></div>
    </div>
  );
}

// ✅ Install Prompt Component - Uses theme context
function PWAInstallPrompt() {
  const { colors } = useThemeContext();
  const { isInstallable, installPWA } = usePWAInstall();

  // Better manual trigger
  const triggerManualPrompt = () => {
  console.log('🔧 Manual PWA test...');
  
  // Create a realistic fake prompt event
  const fakePrompt = {
    prompt: () => {
      console.log('📲 Fake prompt shown - in real scenario, browser would show install dialog');
      alert('In a real PWA scenario, the browser would show the install dialog here. Your PWA is working! 🎉');
      return Promise.resolve({ outcome: 'dismissed' });
    },
    userChoice: Promise.resolve({ outcome: 'dismissed' }),
    preventDefault: () => {}
  };
  
  // Use the global setter from our hook with proper null check
  if (window.setDeferredPrompt) {
    window.setDeferredPrompt(fakePrompt); // ✅ TypeScript knows it's defined here
    window.setIsInstallable?.(true);
    console.log('✅ Manual prompt activated - install button should appear');
  } else {
    console.log('❌ Global helpers not available yet');
  }
};

  // Check current PWA state
  const checkPWAState = () => {
    if (window.getPWAState) {
      const state = window.getPWAState();
      console.log('🔍 Current PWA State:', state);
      alert(`PWA State:\n- Installable: ${state.isInstallable}\n- Has Prompt: ${state.deferredPrompt}\n- Has SW: ${state.hasSW}\n- Has Manifest: ${state.hasManifest}`);
    }
  };

  return (
    <>
      {isInstallable && (
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
      )}
      
      {/* Debug buttons - remove in production */}
      {/* {process.env.NODE_ENV !== 'production' && ( */}
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 9999
        }}>
          <button
            onClick={triggerManualPrompt}
            style={{
              background: '#ff4444',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Test PWA Prompt
          </button>
          <button
            onClick={checkPWAState}
            style={{
              background: '#4444ff',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Check PWA State
          </button>
        </div>
      {/* )} */}
    </>
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