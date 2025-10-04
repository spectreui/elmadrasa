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
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const demoLogins = [
    { 
      role: "Student", 
      email: "student@school.com", 
      password: "student123",
      color: "#10b981",
      icon: "school"
    },
    { 
      role: "Teacher", 
      email: "teacher@school.com", 
      password: "teacher123",
      color: "#3b82f6",
      icon: "person"
    },
    { 
      role: "Admin", 
      email: "admin@school.com", 
      password: "admin123",
      color: "#8b5cf6",
      icon: "shield"
    },
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
      console.log("✅ Login successful");
      router.replace("/(tabs)");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Something went wrong. Please try again.";
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
        bounces={false}
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="items-center mb-12">
            <View className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl items-center justify-center mb-6 shadow-lg">
              <Ionicons name="school" size={48} color="white" />
            </View>
            <Text className="text-4xl font-bold text-gray-900 mb-2">
              ElMadrasa
            </Text>
            <Text className="text-lg text-gray-600 text-center">
              Learn. Grow. Succeed.
            </Text>
          </View>

          {/* Login Form */}
          <View className="space-y-6 mb-8">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-3">
                Email or Student ID
              </Text>
              <View className="relative">
                <TextInput
                  className="border border-gray-300 rounded-2xl p-4 bg-white text-base pl-12 text-gray-900"
                  placeholder="Enter your email or student ID"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                <Ionicons 
                  name="mail" 
                  size={20} 
                  color="#6b7280" 
                  style={{ position: 'absolute', left: 16, top: 14 }}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-3">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  className="border border-gray-300 rounded-2xl p-4 bg-white text-base pl-12 pr-12 text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <Ionicons 
                  name="lock-closed" 
                  size={20} 
                  color="#6b7280" 
                  style={{ position: 'absolute', left: 16, top: 14 }}
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
              className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 flex-row justify-center items-center shadow-lg mt-2"
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
            <Text className="text-center text-gray-500 text-sm mb-4 font-medium">
              Demo Accounts
            </Text>
            <View className="space-y-3">
              {demoLogins.map((demo, index) => (
                <TouchableOpacity
                  key={index}
                  className="bg-white rounded-2xl p-4 flex-row items-center border border-gray-200 shadow-sm active:bg-gray-50"
                  onPress={() => fillDemoCredentials(demo.email, demo.password)}
                >
                  <View 
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: `${demo.color}20` }}
                  >
                    <Ionicons name={demo.icon as any} size={20} color={demo.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      {demo.role}
                    </Text>
                    <Text className="text-gray-500 text-sm">{demo.email}</Text>
                  </View>
                  <View className="bg-gray-100 px-3 py-1 rounded-full">
                    <Text className="text-gray-600 text-xs font-medium">
                      Tap to fill
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View className="items-center">
            <Text className="text-gray-400 text-sm">
              Secure login with modern encryption
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}