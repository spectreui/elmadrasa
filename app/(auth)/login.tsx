import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const demoLogins = [
    { role: "Student", email: "student@school.com", password: "student123" },
    { role: "Teacher", email: "teacher@school.com", password: "teacher123" },
    { role: "Admin", email: "admin@school.com", password: "admin123" },
  ];

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await login(email, password);
      // Expo Router will handle the navigation automatically via the root index.tsx
      // No need for manual navigation here
      console.log("✅ Login successful, waiting for automatic redirect...");
    router.replace('/(tabs)');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Something went wrong. Please try again.";
      Alert.alert("Login Failed", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-8">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-blue-500 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="school" size={40} color="white" />
            </View>
            <Text className="text-4xl font-bold text-blue-600 mb-2">
              School App
            </Text>
            <Text className="text-lg text-gray-600 text-center">
              Learn. Grow. Succeed.
            </Text>
          </View>

          {/* Login Form */}
          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email or Student ID
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl p-4 bg-white text-base"
                placeholder="Enter your email or student ID"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className="border border-gray-300 rounded-xl p-4 bg-white text-base pr-12"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  className="absolute right-3 top-3"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className="bg-blue-600 rounded-xl p-4 flex-row justify-center items-center shadow-sm mt-4"
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="log-in" size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Sign In
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Demo Accounts */}
          <View className="mb-8">
            <Text className="text-center text-gray-500 text-sm mb-4">
              Demo Accounts (Click to fill)
            </Text>
            <View className="space-y-2">
              {demoLogins.map((demo, index) => (
                <TouchableOpacity
                  key={index}
                  className="border border-gray-300 rounded-xl p-3 flex-row items-center"
                  onPress={() => fillDemoCredentials(demo.email, demo.password)}
                >
                  <View
                    className={`w-3 h-3 rounded-full mr-3 ${
                      demo.role === "Student"
                        ? "bg-green-500"
                        : demo.role === "Teacher"
                        ? "bg-blue-500"
                        : "bg-purple-500"
                    }`}
                  />
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {demo.role}
                    </Text>
                    <Text className="text-gray-500 text-sm">{demo.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
