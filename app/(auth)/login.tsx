import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,

  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions } from
"react-native";
import Alert from '@/components/Alert';
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { designTokens } from "../../src/utils/designTokens";
import { useThemeContext } from "../../src/contexts/ThemeContext";import { useTranslation } from "@/hooks/useTranslation";

const { width } = Dimensions.get('window');

export default function LoginScreen() {const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const { fontFamily, colors, isDark } = useThemeContext();


  const demoLogins = [
  {
    role: "Student",
    email: "student1@school.com",
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
  }];


  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    clearError();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await login(email, password);
      router.replace("/");
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Login failed. Please check your credentials.";

      Alert.alert(
        "Login Failed",
        errorMessage,
        [{ text: "OK", onPress: clearError }]
      );
    }
  };

  const handleSubmitEditing = () => {
    if (email && password) {
      handleLogin();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}>

      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled">

        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: designTokens.spacing.xl }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: designTokens.spacing.xxxl }}>
            <View style={{
              width: 96,
              height: 96,
              backgroundColor: colors.primary,
              borderRadius: designTokens.borderRadius.xxl,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: designTokens.spacing.xl,
              ...designTokens.shadows.lg
            }}>
              <Ionicons name="school" size={48} color="white" />
            </View>
            <Text style={{ fontFamily, 
              fontSize: designTokens.typography.largeTitle.fontSize,
              fontWeight: designTokens.typography.largeTitle.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.xs
            } as any}>
              ElMadrasa
            </Text>
            <Text style={{ fontFamily, 
              fontSize: designTokens.typography.body.fontSize,
              color: colors.textSecondary,
              textAlign: 'center'
            }}>
              Learn. Grow. Succeed.
            </Text>
          </View>

          {/* Error Display */}
          {error &&
          <View style={{
            backgroundColor: `${colors.error}10`,
            borderColor: `${colors.error}20`,
            borderWidth: 1,
            borderRadius: designTokens.borderRadius.xl,
            padding: designTokens.spacing.lg,
            marginBottom: designTokens.spacing.xl
          }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="warning" size={20} color={colors.error} />
                <Text style={{ fontFamily, 
                color: colors.error,
                fontWeight: '500',
                marginLeft: designTokens.spacing.sm,
                flex: 1
              }}>
                  {error}
                </Text>
              </View>
            </View>
          }

          {/* Login Form */}
          <View style={{ marginBottom: designTokens.spacing.xxl }}>
            <View style={{ marginBottom: designTokens.spacing.lg }}>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.sm
              }}>
                Email or Student ID
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: designTokens.borderRadius.xl,
                    padding: designTokens.spacing.lg,
                    backgroundColor: colors.backgroundElevated,
                    color: colors.textPrimary,
                    fontSize: designTokens.typography.body.fontSize,
                    paddingLeft: 52
                  }}
                  placeholder="Enter your email or student ID"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError();
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  editable={!isLoading} />

                <Ionicons
                  name="mail"
                  size={20}
                  color={colors.textTertiary}
                  style={{
                    position: 'absolute',
                    left: designTokens.spacing.lg,
                    top: 18
                  }} />

              </View>
            </View>

            <View style={{ marginBottom: designTokens.spacing.lg }}>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.sm
              }}>
                Password
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: designTokens.borderRadius.xl,
                    padding: designTokens.spacing.lg,
                    backgroundColor: colors.backgroundElevated,
                    color: colors.textPrimary,
                    fontSize: designTokens.typography.body.fontSize,
                    paddingLeft: 52,
                    paddingRight: 52
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError();
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmitEditing}
                  editable={!isLoading} />

                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={colors.textTertiary}
                  style={{
                    position: 'absolute',
                    left: designTokens.spacing.lg,
                    top: 18
                  }} />

                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: designTokens.spacing.md,
                    top: 16
                  }}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}>

                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color={colors.textTertiary} />

                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: isLoading ? colors.textTertiary : colors.primary,
                borderRadius: designTokens.borderRadius.xl,
                padding: designTokens.spacing.lg,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                ...designTokens.shadows.md,
                marginTop: designTokens.spacing.sm,
                opacity: (!email.trim() || !password.trim()) && !isLoading ? 0.7 : 1
              }}
              onPress={handleLogin}
              disabled={isLoading || !email.trim() || !password.trim()}>

              {isLoading ?
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={{ fontFamily, 
                  color: 'white',
                  fontWeight: '600',
                  fontSize: designTokens.typography.body.fontSize,
                  marginLeft: designTokens.spacing.sm
                }}>
                    Signing In...
                  </Text>
                </View> :

              <>
                  <Ionicons name="log-in" size={20} color="white" />
                  <Text style={{ fontFamily, 
                  color: 'white',
                  fontWeight: '600',
                  fontSize: designTokens.typography.body.fontSize,
                  marginLeft: designTokens.spacing.sm
                }}>
                    Sign In
                  </Text>
                </>
              }
            </TouchableOpacity>
          </View>

          {/* Signup Option */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: designTokens.spacing.xxl
          }}>
            <Text style={{ fontFamily, 
              color: colors.textSecondary,
              fontSize: designTokens.typography.body.fontSize
            }}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={{ fontFamily, 
                color: colors.primary,
                fontWeight: '600',
                fontSize: designTokens.typography.body.fontSize
              }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo Accounts */}
          <View style={{ marginBottom: designTokens.spacing.xxl }}>
            <Text style={{ fontFamily, 
              textAlign: 'center',
              color: colors.textTertiary,
              fontSize: designTokens.typography.footnote.fontSize,
              fontWeight: '600',
              marginBottom: designTokens.spacing.md
            }}>
              Demo Accounts - Tap to Auto-fill
            </Text>
            <View style={{ gap: designTokens.spacing.sm }}>
              {demoLogins.map((demo, index) =>
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: colors.backgroundElevated,
                  borderRadius: designTokens.borderRadius.xl,
                  padding: designTokens.spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  ...designTokens.shadows.sm
                }}
                onPress={() => fillDemoCredentials(demo.email, demo.password)}
                disabled={isLoading}
                activeOpacity={0.8}>

                  <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: designTokens.borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: designTokens.spacing.md,
                    backgroundColor: `${demo.color}15`
                  }}>

                    <Ionicons name={demo.icon as any} size={20} color={demo.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily, 
                    fontWeight: '600',
                    color: colors.textPrimary,
                    fontSize: designTokens.typography.body.fontSize
                  }}>
                      {demo.role}
                    </Text>
                    <Text style={{ fontFamily, 
                    color: colors.textSecondary,
                    fontSize: designTokens.typography.caption1.fontSize
                  }}>
                      {demo.email}
                    </Text>
                  </View>
                  <View style={{
                  paddingHorizontal: designTokens.spacing.md,
                  paddingVertical: designTokens.spacing.xs,
                  borderRadius: designTokens.borderRadius.full,
                  backgroundColor: colors.separator
                }}>
                    <Text style={{ fontFamily, 
                    color: colors.textSecondary,
                    fontSize: designTokens.typography.caption2.fontSize,
                    fontWeight: '500'
                  }}>
                      {isLoading ? t("common.loading") : 'Tap to fill'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', paddingBottom: designTokens.spacing.xxl }}>
            <Text style={{ fontFamily, 
              color: colors.textTertiary,
              fontSize: designTokens.typography.footnote.fontSize,
              textAlign: 'center'
            }}>
              Secure login with modern encryption
            </Text>
            <Text style={{ fontFamily, 
              color: colors.textTertiary,
              fontSize: designTokens.typography.caption1.fontSize,
              marginTop: designTokens.spacing.xs
            }}>
              Version 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>);

}