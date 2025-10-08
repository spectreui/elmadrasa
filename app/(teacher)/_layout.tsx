import { Tabs, Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { View, Text } from "react-native";
import { useEffect } from "react";

export default function TeacherLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  console.log('🔐 Auth State:', { 
    isAuthenticated, 
    loading, 
    userRole: user?.role 
  });

  // Handle navigation based on auth state changes
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('➡️ Redirecting to login');
        router.replace('/(auth)/login');
      } else if (user?.role === 'teacher' || user?.role === 'admin') {
        console.log('➡️ Redirecting teacher to teacher dashboard');
        router.replace('/(teacher)');
      } else {
        console.log('➡️ Redirecting student to tabs');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, loading, user, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e5e7",
          borderTopWidth: 0.5,
          height: 88,
          paddingBottom: 34,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          letterSpacing: -0.24,
          marginTop: 6,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: "Exams",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create-homework"
        options={{
          title: "Assign",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "add-circle" : "add-circle-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: "Classes",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "bar-chart" : "bar-chart-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          href: null,
          tabBarIcon: ({ color, size, focused }) => (
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="exam-results/[id]"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
      <Tabs.Screen
        name="create-exam"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
    </Tabs>
  );
}
