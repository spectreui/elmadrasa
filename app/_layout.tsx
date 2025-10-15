// app/_layout.tsx - Fixed version
import "../global.css";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
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
import { apiService } from "@/src/services/api";

// Keep splash screen until ready
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

// ✅ Role + path redirect controller - FIXED
function RoleAwareRedirect() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (loading || hasRedirected) return;

    const first = segments[0];
    const path = "/" + segments.join("/");
    const inAuthGroup = first === "(auth)";
    const inRoleGroup = ["(student)", "(teacher)", "(admin)"].includes(first);

    // ✅ Safe routes that don't need role-based redirects
    const safeRoutes = [
      "",
      "/",
      "/unauthorized",
      "/network-error",
      "/not-found",
      "/(auth)/login",
      "/(auth)/register",
      "/(auth)/forgot-password",
    ];

    const isSafe = safeRoutes.includes(path) || safeRoutes.some(safe => path.startsWith(safe));

    console.log('📍 Route check:', { path, first, inAuthGroup, inRoleGroup, isSafe, isAuthenticated, userRole: user?.role });

    // 🚫 Not logged in → redirect to login (except safe routes)
    if (!isAuthenticated && !inAuthGroup && !isSafe) {
      console.log("🔒 Redirecting to login - not authenticated");
      setHasRedirected(true);
      router.replace("/(auth)/login");
      return;
    }

    // ✅ Already on safe route - no redirect needed
    if (isSafe || inAuthGroup) {
      console.log("✅ On safe route, no redirect needed");
      setHasRedirected(true);
      return;
    }

    // ✅ If user is authenticated, handle role-based routing
    if (isAuthenticated && user?.role) {
      const expectedGroup = `(${user.role})`;
      
      // ✅ Already in correct role group
      if (inRoleGroup && first === expectedGroup) {
        console.log("✅ Already in correct role group");
        setHasRedirected(true);
        return;
      }

      // ✅ Redirect to correct role group
      const basePath = segments.join("/");
      const target = basePath.startsWith(expectedGroup) 
        ? basePath 
        : `${expectedGroup}/${basePath === "/" ? "" : basePath}`;
      
      const cleanTarget = "/" + target.replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "") || "/";
      
      console.log(`🔁 Redirecting to role group: ${path} → ${cleanTarget}`);
      setHasRedirected(true);
      router.replace(cleanTarget);
      return;
    }
  }, [isAuthenticated, loading, user, segments, hasRedirected]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
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

  // ✅ Pre-warm token (to avoid unauthorized flickers)
  useEffect(() => {
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
      <ThemeProvider>
        <ThemeWrapper>
          <AuthProvider>
            <NotificationProvider>
              <SafeAreaView>
                <RoleAwareRedirect />
                <Slot />
              </SafeAreaView>
            </NotificationProvider>
          </AuthProvider>
        </ThemeWrapper>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
