// app/(auth)/signup-success.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import { useThemeContext } from '../../src/contexts/ThemeContext';

export default function SignUpSuccess() {
  const { role, name } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useThemeContext();

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: designTokens.spacing.xl,
    }}>
      <View style={{ 
        alignItems: 'center',
        maxWidth: 400,
      }}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: `${colors.primary}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: designTokens.spacing.xxl,
        }}>
          <Ionicons 
            name="checkmark-circle" 
            size={60} 
            color={colors.primary} 
          />
        </View>

        <Text style={{
          fontSize: designTokens.typography.largeTitle.fontSize,
          fontWeight: designTokens.typography.largeTitle.fontWeight,
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: designTokens.spacing.md,
        } as any}>
          Welcome, {name}!
        </Text>

        <Text style={{
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: designTokens.spacing.xxl,
        }}>
          {role === 'teacher' 
            ? 'Your account is pending admin approval. You will receive an email once approved.'
            : 'Your account has been created successfully. Please wait for admin approval before logging in.'
          }
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            borderRadius: designTokens.borderRadius.xl,
            padding: designTokens.spacing.lg,
            alignItems: 'center',
            justifyContent: 'center',
            ...designTokens.shadows.md,
            width: '100%',
          }}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={{
            color: 'white',
            fontWeight: '600',
            fontSize: designTokens.typography.body.fontSize,
          }}>
            Go to Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
