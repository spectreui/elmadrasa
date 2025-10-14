import { Tabs, Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { View, Text } from "react-native";
import { useEffect } from "react";
import { useThemeContext } from "@/contexts/ThemeContext";

export default function TeacherLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const { isDark, colors, toggleTheme } = useThemeContext();

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
      } else if (isAuthenticated && user?.role === 'teacher') {
        console.log('➡️ Redirecting teacher to teacher dashboard');
        router.replace('/(teacher)');
      } else if (isAuthenticated && user?.role === 'admin') {
        console.log('➡️ Redirecting teacher to teacher dashboard');
        router.replace('/(admin)');
      } else if (isAuthenticated && user?.role === 'student') {
        console.log('➡️ Redirecting student to tabs');
        router.replace('/(student)');
      }
    }
  }, [isAuthenticated, loading, user, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundElevated,
          borderTopColor: colors.border,
          height: 70,
          paddingBottom: 0,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
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
        name="homework/index"
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
        name="my-classes"
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
      <Tabs.Screen
        name="homework/[id]/submissions"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
      <Tabs.Screen
        name="homework/create"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
      <Tabs.Screen
        name="exams/[id]"
        options={{
          href: null, // This hides it from tab bar
        }}
      />
    </Tabs>
  );
}
