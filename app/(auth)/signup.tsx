// app/(auth)/sign-up.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'student' as 'student' | 'teacher',
    studentId: '',
    class: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const signUpData = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          name: formData.name,
          class: formData.class,
        },
        ...(formData.role === 'student' && formData.studentId && { student_id: formData.studentId }),
      };

      const response = await apiService.api.post('/auth/register', signUpData);

      if (response.data.success) {
        Alert.alert(
          'Success',
          formData.role === 'teacher' 
            ? 'Registration successful! Please wait for admin approval.'
            : 'Registration successful! You can now log in.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={cn('flex-1', Theme.background)}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-1 min-h-screen px-6 py-12">
          {/* Header */}
          <View className="mb-12">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800 mb-6"
            >
              <Ionicons name="arrow-back" size={20} className="text-gray-600 dark:text-gray-400" />
            </TouchableOpacity>
            <Text className={cn('text-4xl font-bold mb-3', Theme.text.primary)}>
              Create Account
            </Text>
            <Text className={cn('text-lg', Theme.text.secondary)}>
              Join your school community
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-5">
            {/* Name */}
            <View>
              <Text className={cn('text-sm font-medium mb-2', Theme.text.primary)}>
                Full Name *
              </Text>
              <TextInput
                className={cn(
                  'w-full px-4 py-4 rounded-2xl border text-lg',
                  Theme.border,
                  Theme.background,
                  Theme.text.primary
                )}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Email */}
            <View>
              <Text className={cn('text-sm font-medium mb-2', Theme.text.primary)}>
                Email Address *
              </Text>
              <TextInput
                className={cn(
                  'w-full px-4 py-4 rounded-2xl border text-lg',
                  Theme.border,
                  Theme.background,
                  Theme.text.primary
                )}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Role Selection */}
            <View>
              <Text className={cn('text-sm font-medium mb-3', Theme.text.primary)}>
                I am a *
              </Text>
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  className={cn(
                    'flex-1 px-4 py-4 rounded-2xl border flex-row items-center justify-center space-x-2',
                    formData.role === 'student' 
                      ? 'bg-blue-500 border-blue-500' 
                      : Theme.border
                  )}
                  onPress={() => setFormData({ ...formData, role: 'student' })}
                >
                  <Ionicons 
                    name="school" 
                    size={20} 
                    color={formData.role === 'student' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text className={
                    formData.role === 'student' 
                      ? 'text-white font-semibold' 
                      : cn('font-semibold', Theme.text.primary)
                  }>
                    Student
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={cn(
                    'flex-1 px-4 py-4 rounded-2xl border flex-row items-center justify-center space-x-2',
                    formData.role === 'teacher' 
                      ? 'bg-blue-500 border-blue-500' 
                      : Theme.border
                  )}
                  onPress={() => setFormData({ ...formData, role: 'teacher' })}
                >
                  <Ionicons 
                    name="person" 
                    size={20} 
                    color={formData.role === 'teacher' ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text className={
                    formData.role === 'teacher' 
                      ? 'text-white font-semibold' 
                      : cn('font-semibold', Theme.text.primary)
                  }>
                    Teacher
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Student ID (only for students) */}
            {formData.role === 'student' && (
              <View>
                <Text className={cn('text-sm font-medium mb-2', Theme.text.primary)}>
                  Student ID
                </Text>
                <TextInput
                  className={cn(
                    'w-full px-4 py-4 rounded-2xl border text-lg',
                    Theme.border,
                    Theme.background,
                    Theme.text.primary
                  )}
                  placeholder="Enter your student ID (optional)"
                  value={formData.studentId}
                  onChangeText={(text) => setFormData({ ...formData, studentId: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            {/* Class (for students) */}
            {formData.role === 'student' && (
              <View>
                <Text className={cn('text-sm font-medium mb-2', Theme.text.primary)}>
                  Class
                </Text>
                <TextInput
                  className={cn(
                    'w-full px-4 py-4 rounded-2xl border text-lg',
                    Theme.border,
                    Theme.background,
                    Theme.text.primary
                  )}
                  placeholder="Enter your class (e.g., 10A)"
                  value={formData.class}
                  onChangeText={(text) => setFormData({ ...formData, class: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            {/* Password */}
            <View>
              <Text className={cn('text-sm font-medium mb-2', Theme.text.primary)}>
                Password *
              </Text>
              <View className="relative">
                <TextInput
                  className={cn(
                    'w-full px-4 py-4 rounded-2xl border text-lg pr-12',
                    Theme.border,
                    Theme.background,
                    Theme.text.primary
                  )}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  className="absolute right-4 top-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    className="text-gray-500" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View>
              <Text className={cn('text-sm font-medium mb-2', Theme.text.primary)}>
                Confirm Password *
              </Text>
              <TextInput
                className={cn(
                  'w-full px-4 py-4 rounded-2xl border text-lg',
                  Theme.border,
                  Theme.background,
                  Theme.text.primary
                )}
                placeholder="Confirm your password"
                secureTextEntry={!showPassword}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              className={cn(
                'w-full py-5 rounded-2xl items-center mt-6',
                loading ? 'bg-blue-400' : 'bg-blue-500'
              )}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <Text className="text-white font-semibold text-lg">Creating Account...</Text>
              ) : (
                <Text className="text-white font-semibold text-lg">Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <View className="flex-row justify-center mt-8">
              <Text className={cn('text-base', Theme.text.secondary)}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text className="text-blue-500 font-semibold text-base">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}