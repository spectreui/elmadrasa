// app/_layout.tsx
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
import { apiService } from "@/src/services/api"; // ✅ make sure import path matches

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

// ✅ Role + path redirect controller
function RoleAwareRedirect() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const first = segments[0];
    const path = "/" + segments.join("/");
    const inAuthGroup = first === "(auth)";
    const inRoleGroup = ["(student)", "(teacher)", "(admin)"].includes(first);

    // ✅ Shared routes that exist for both student and teacher
    const sharedRoutes = ["/exams", "/homework", "/profile"];

    // ✅ Routes that should never be prefixed
    const safeRoutes = [
      "/unauthorized",
      "/network-error",
      "/(auth)/login",
      "/(auth)/register",
      "/(auth)/forgot-password",
    ];

    const isSafe = safeRoutes.some((safe) => path.startsWith(safe));

    // 🚫 Not logged in → redirect to login
    if (!isAuthenticated && !inAuthGroup && !isSafe) {
      console.log("🔒 Redirecting to login");
      router.replace("/(auth)/login");
      return;
    }

    // Skip redirecting safe or auth routes
    if (isSafe || inAuthGroup) return;

    // ✅ If user is authenticated, handle shared paths explicitly
    if (isAuthenticated && user?.role) {
      const expectedGroup = `(${user.role})`;
      const basePath = "/" + segments.slice(1).join("/"); // remove group prefix if any

      // If we're on a shared path like /homework → send to /(<role>)/homework
      const sharedMatch = sharedRoutes.find((r) => path.startsWith(r));

      if (sharedMatch) {
        const target = `${expectedGroup}${path}`;
        console.log(`🧭 Redirecting shared route: ${path} → ${target}`);
        router.replace(target);
        return;
      }

      // For all other routes, make sure we’re inside the right role group
      if (!inRoleGroup || first !== expectedGroup) {
        const rest = segments.join("/");
        const normalizedRest = rest.startsWith(expectedGroup + "/")
          ? rest.replace(`${expectedGroup}/`, "")
          : rest;
        const target = `${expectedGroup}/${normalizedRest}`.replace(/\/+$/, "");

        console.log(`🔁 Redirecting → ${target}`);
        router.replace("/" + target);
      }
    }
  }, [isAuthenticated, loading, user, segments]);

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
                {/* Only redirect if inside main routes */}
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
