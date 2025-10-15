// app/index.tsx
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Index() {
  const { isAuthenticated, loading, user } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      setChecked(true);
    }
  }, [loading]);

  if (loading || !checked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated && user?.role) {
    return <Redirect href={`(${user.role})/`} />;
  }

  // Otherwise, redirect to login
  return <Redirect href="/(auth)/login" />;
}
