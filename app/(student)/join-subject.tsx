// app/(student)/join-subject.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  RefreshControl } from
'react-native';
import Alert from '@/components/Alert';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import Animated, { FadeIn } from 'react-native-reanimated';import { useTranslation } from "@/hooks/useTranslation";

const { width } = Dimensions.get('window');

export default function JoinSubjectScreen() {const { t } = useTranslation();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useThemeContext();
  const [refreshing, setRefreshing] = useState(false);


  const onRefresh = () => {
    setRefreshing(true);
  };

  const handleJoinSubject = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.joinSubjectWithCode(joinCode.trim());

      if (response.data.success) {
        Alert.alert('Success', 'Successfully joined the subject!', [
        { text: 'OK', onPress: () => router.push('/(student)') }]
        );
        setJoinCode('');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to join subject');
    } finally {
      setLoading(false);
    }
  };

  // Responsive styles
  const responsiveStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      paddingTop: designTokens.spacing.xxxl,
      paddingHorizontal: designTokens.spacing.xl,
      paddingBottom: designTokens.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    title: {
      fontSize: width < 350 ? designTokens.typography.title2.fontSize : designTokens.typography.title1.fontSize,
      fontWeight: designTokens.typography.title1.fontWeight,
      color: colors.textPrimary,
      marginBottom: designTokens.spacing.xs
    },
    subtitle: {
      fontSize: designTokens.typography.body.fontSize,
      color: colors.textSecondary
    },
    content: {
      padding: designTokens.spacing.xl
    },
    card: {
      backgroundColor: colors.backgroundElevated,
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.lg,
      ...designTokens.shadows.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: designTokens.spacing.xl
    },
    cardTitle: {
      fontSize: designTokens.typography.headline.fontSize,
      fontWeight: designTokens.typography.headline.fontWeight,
      color: colors.textPrimary,
      marginBottom: designTokens.spacing.sm
    },
    cardText: {
      fontSize: designTokens.typography.body.fontSize,
      color: colors.textSecondary
    },
    label: {
      fontSize: designTokens.typography.footnote.fontSize,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: designTokens.spacing.sm
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: designTokens.borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: designTokens.spacing.md,
      fontSize: designTokens.typography.body.fontSize,
      color: colors.textPrimary,
      fontFamily: 'monospace',
      minHeight: 50
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: designTokens.borderRadius.xl,
      paddingVertical: designTokens.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...designTokens.shadows.md,
      minHeight: 50
    },
    buttonText: {
      color: 'white',
      fontSize: designTokens.typography.body.fontSize,
      fontWeight: '600',
      marginLeft: designTokens.spacing.sm
    }
  } as any);

  return (
    <Animated.ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      entering={FadeIn.duration(600)} // Smooth fade-in when screen loads
      refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.primary}
        colors={[colors.primary]}
        style={{ backgroundColor: 'transparent' }} />

      }>

      <View style={responsiveStyles.container}>
        {/* Header */}
        <View style={responsiveStyles.header}>
          <Text style={responsiveStyles.title}>Join Subject</Text>
          <Text style={responsiveStyles.subtitle}>Enter the join code from your teacher</Text>
        </View>

        <View style={responsiveStyles.content}>
          {/* Instructions */}
          <View style={responsiveStyles.card}>
            <Text style={responsiveStyles.cardTitle}>How to join a subject:</Text>
            <Text style={responsiveStyles.cardText}>
              1. Get the join code from your teacher{'\n'}
              2. Enter it below{'\n'}
              3. You'll be automatically enrolled in that subject
            </Text>
          </View>

          {/* Join Code Input */}
          <View style={{ marginBottom: designTokens.spacing.xxl }}>
            <Text style={responsiveStyles.label}>{t("classes.joinCode")}</Text>
            <TextInput
              style={responsiveStyles.input}
              placeholder="SEC-2B-PHY-7KQWZ"
              placeholderTextColor={colors.textTertiary}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20} />

          </View>

          {/* Join Button */}
          <TouchableOpacity
            style={[
            responsiveStyles.button,
            (!joinCode.trim() || loading) && { opacity: 0.7 }]
            }
            onPress={handleJoinSubject}
            disabled={loading || !joinCode.trim()}
            activeOpacity={0.8}>

            {loading ?
            <ActivityIndicator size="small" color="white" /> :

            <>
                <Ionicons name="enter" size={20} color="white" />
                <Text style={responsiveStyles.buttonText}>Join Subject</Text>
              </>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Animated.ScrollView>);

}