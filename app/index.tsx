// app/index.tsx - Simplified root handler - let AuthProvider manage routing
import { ActivityIndicator, View } from "react-native";
import { Redirect, usePathname } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function Index() {
  const { isAuthenticated, loading, user, isOnline } = useAuth();
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

  // Only handle root path redirection
  if (isAuthenticated && user?.role) {
    // Redirect to role group root
    return <Redirect href={`/(${user.role})`} />;
  }

  // Let AuthProvider handle all other routing
  return null;
}
