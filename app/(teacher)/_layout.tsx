import { Tabs, Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { View, Text } from "react-native";
import { useThemeContext } from "@/contexts/ThemeContext"; import { useTranslation } from "@/hooks/useTranslation";
import LiquidGlassTabBar from "@/components/TabBar";

export default function TeacherLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const { fontFamily, colors } = useThemeContext();

  // Force arabic
  // setLanguage('ar');

  console.log('🔐 Auth State:', {
    isAuthenticated,
    loading,
    userRole: user?.role
  });

  // Handle navigation based on auth state changes

  if (!isAuthenticated) {
    console.log('➡️ Redirecting to login');
    router.replace('/(auth)/login');
  } else if (user?.role !== "teacher" && isAuthenticated) {
    return <Redirect href="/unauthorized" />;
  }

  return (
    <Tabs
      tabBar={props => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 0,
          paddingTop: 8,
          position: 'relative',
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "rgba(107, 114, 128, 0.7)",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500"
        },
      }}
    >

      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          sceneStyle: {paddingBottom: 80},
          tabBarIcon: ({ color, size, focused }) =>
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color} />
            </View>

        }} />

      <Tabs.Screen
        name="exams/index"
        options={{
          title: t('exams'),
          sceneStyle: {paddingBottom: 80},
          tabBarIcon: ({ color, size, focused }) =>
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                size={24}
                color={color} />

            </View>

        }} />

      <Tabs.Screen
        name="homework/index"
        options={{
          title: t("homeworks"),
          sceneStyle: {paddingBottom: 80},
          tabBarIcon: ({ color, size, focused }) =>
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "add-circle" : "add-circle-outline"}
                size={26}
                color={color} />

            </View>

        }} />

      <Tabs.Screen
        name="my-classes"
        options={{
          title: t("dashboard.classes"),
          sceneStyle: {paddingBottom: 80},
          tabBarIcon: ({ color, size, focused }) =>
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={24}
                color={color} />

            </View>

        }} />

      <Tabs.Screen
        name="statistics"
        options={{
          title: t("dashboard.analytics"),
          sceneStyle: {paddingBottom: 80},
          tabBarIcon: ({ color, size, focused }) =>
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "bar-chart" : "bar-chart-outline"}
                size={24}
                color={color} />

            </View>

        }} />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile.title"),
          href: null,
          tabBarIcon: ({ color, size, focused }) =>
            <View className="items-center justify-center">
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={24}
                color={color} />

            </View>

        }} />

      <Tabs.Screen
        name="exam-results/[id]"
        options={{
          href: null // This hides it from tab bar
        }} />

      <Tabs.Screen
        name="create-exam"
        options={{
          href: null // This hides it from tab bar
        }} />

      <Tabs.Screen
        name="homework/[id]/submissions"
        options={{
          href: null // This hides it from tab bar
        }} />

      <Tabs.Screen
        name="homework/create"
        options={{
          href: null // This hides it from tab bar
        }} />

      <Tabs.Screen
        name="exams/[id]"
        options={{
          href: null // This hides it from tab bar
        }} />

    </Tabs>
  );
}