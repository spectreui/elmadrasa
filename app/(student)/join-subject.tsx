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
  RefreshControl
} from 'react-native';
import Alert from '@/components/Alert';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function JoinSubjectScreen() {
  const { t, isRTL } = useTranslation();
  const { isOnline } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors } = useThemeContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
  };

  const handleJoinSubject = async () => {
    if (!joinCode.trim()) {
      Alert.alert(t("common.error"), t("classes.joinCodeRequired"));
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.joinSubjectWithCode(joinCode.trim());

      if (response.data.success) {
        Alert.alert(t("common.success"), t("classes.joinSuccess"), [
          { text: t("common.ok"), onPress: () => router.push('/(student)') }
        ]);
        setJoinCode('');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      Alert.alert(t("common.error"), error.response?.data?.error || t("classes.joinFailed"));
      // Show offline message if offline
      if (!isOnline) {
        Alert.alert(
          t("common.offline"),
          t("dashboard.offlineMessage"),
          [{ text: t("common.ok") }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      entering={FadeIn.duration(600)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          style={{ backgroundColor: 'transparent' }}
        />
      }
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t("classes.joinSubject")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("classes.enterJoinCode")}
          </Text>
        </View>

        <View style={styles.content}>
          {/* Instructions */}
          <View style={[styles.card, {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.border
          }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {t("classes.howToJoin")}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              {t("classes.joinInstructions")}
            </Text>
          </View>

          {/* Join Code Input */}
          <View style={{ marginBottom: designTokens.spacing.xxl }}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t("classes.joinCode")}
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.textPrimary,
                textAlign: isRTL ? 'right' : 'left'
              }]}
              placeholder={t("classes.joinCodePlaceholder")}
              placeholderTextColor={colors.textTertiary}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          {/* Join Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                ...designTokens.shadows.md
              },
              (!joinCode.trim() || loading) && { opacity: 0.7 }
            ]}
            onPress={handleJoinSubject}
            disabled={loading || !joinCode.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                <Ionicons name="enter" size={20} color="white" />
                <Text style={[styles.buttonText, { [isRTL ? 'marginRight' : 'marginLeft']: designTokens.spacing.sm }]}>
                  {t("classes.joinSubject")}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 70,
  },
  header: {
    paddingTop: designTokens.spacing.xxxl,
    paddingHorizontal: designTokens.spacing.xl,
    paddingBottom: designTokens.spacing.lg,
    borderBottomWidth: 1
  },
  title: {
    fontSize: width < 350 ? designTokens.typography.title2.fontSize : designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight,
    marginBottom: designTokens.spacing.xs
  },
  subtitle: {
    fontSize: designTokens.typography.body.fontSize
  },
  content: {
    padding: designTokens.spacing.xl
  },
  card: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    ...designTokens.shadows.sm,
    borderWidth: 1,
    marginBottom: designTokens.spacing.xl
  },
  cardTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: designTokens.typography.headline.fontWeight,
    marginBottom: designTokens.spacing.sm
  },
  cardText: {
    fontSize: designTokens.typography.body.fontSize,
    lineHeight: 22
  },
  label: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.sm
  },
  input: {
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    padding: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
    minHeight: 50
  },
  button: {
    borderRadius: designTokens.borderRadius.xl,
    paddingVertical: designTokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50
  },
  buttonText: {
    color: 'white',
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600'
  }
});
