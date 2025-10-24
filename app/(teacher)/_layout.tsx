import { Tabs, Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { View } from "react-native";
import { useTranslation } from "@/hooks/useTranslation";
import LiquidGlassTabBar from "@/components/TabBar";

export default function TeacherLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  // Force arabic
  // setLanguage('ar');

  console.log('🔐 Auth State:', {
    isAuthenticated,
    loading,
    userRole: user?.role
  });


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
        name="homework/edit/[id]"
        options={{
          href: null // This hides it from tab bar
        }} />

      <Tabs.Screen
        name="activity"
        options={{
          href: null // This hides it from tab bar
        }} />

      <Tabs.Screen
        name="homework/create"
        options={{
          href: null // This hides it from tab bar
        }} />

      <Tabs.Screen
        name="homework/[id]/index"
        options={{
          href: null // This hides it from tab bar
        }} />

      <Tabs.Screen
        name="exams/[id]"
        options={{
          href: null // This hides it from tab bar
        }} />
      <Tabs.Screen
        name="exams/grading/[id]"
        options={{
          // sceneStyle: {paddingBottom: 40},
          tabBarStyle: {
            display: 'none'
          },
          href: null // This hides it from tab bar
        }} />
      <Tabs.Screen
        name="exams/grading/index"
        options={{
          href: null // This hides it from tab bar
        }} />
    </Tabs>
  );
}