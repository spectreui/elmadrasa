// app/index.tsx - Fixed role-based redirection for root dashboard
import { ActivityIndicator, View } from "react-native";
import { Redirect, usePathname } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function Index() {
  const { isAuthenticated, loading, user } = useAuth();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  // Handle the case where auth state might be delayed
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setChecked(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Show loading while auth is initializing
  if (loading || !checked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log('🏠 Index redirect check:', {
    pathname,
    isAuthenticated,
    userRole: user?.role,
    userId: user?.id
  });

  // Only redirect if the user is actually at root "/"
  if (pathname === "/" && isAuthenticated && user?.role) {
    // Redirect to role-appropriate dashboard (which is the root of the role group)
    const dashboardPath = `/(${user.role})`;
    console.log(`➡️ Redirecting to ${dashboardPath}`);
    return <Redirect href={dashboardPath} />;
  }

  // If authenticated but no role (offline scenario), try to determine role
  if (pathname === "/" && isAuthenticated && !user?.role) {
    console.log('📱 Offline scenario - redirecting to default dashboard');
    // Try to get role from token or default to student
    return <Redirect href="/(student)/" />;
  }

  // If not authenticated, redirect to login
  if (pathname === "/" && !isAuthenticated) {
    console.log('➡️ Redirecting to login');
    return <Redirect href="/login" />;
  }

  // Otherwise, render nothing (or fallback)
  return null;
}
