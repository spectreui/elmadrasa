// app/(teacher)/exams/grading/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { apiService } from '../../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../../../src/contexts/ThemeContext';
import { designTokens } from '../../../../src/utils/designTokens';
import { useTranslation } from "@/hooks/useTranslation";

interface Submission {
  id: string;
  exam: {
    title: string;
    subject: string;
    class: string;
  };
  student: {
    profile: {
      name: string;
    };
  };
  answers?: Array<{
    question_id: string;
    answer: string;
    is_correct: boolean;
    points: number;
    needs_grading?: boolean;
  }>;
  total_points: number;
  needs_manual_grading: boolean;
  is_manually_graded: boolean;
}

export default function ManualGradingScreen() {
  const { t } = useTranslation();
  const { colors, fontFamily } = useThemeContext();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSubmissionsNeedingGrading();

      if (response.data.success) {
        // Add safety check for data structure
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        setSubmissions(data);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
      Alert.alert('Error', 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubmissions();
  };

  // Safety function to count text questions
  const countTextQuestions = (answers: any[] | undefined) => {
    if (!answers || !Array.isArray(answers)) return 0;
    return answers.filter(a => a?.needs_grading).length;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily, color: colors.textSecondary, marginTop: 10 }}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: designTokens.spacing.xl,
        paddingTop: designTokens.spacing.xxxl,
        paddingBottom: designTokens.spacing.lg,
        backgroundColor: colors.backgroundElevated,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: designTokens.spacing.lg }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{
            fontFamily,
            fontSize: designTokens.typography.title2.fontSize,
            fontWeight: 'bold',
            color: colors.textPrimary,
            marginLeft: designTokens.spacing.md,
            flex: 1
          }}>
            {t('exams.manualGrading')}
          </Text>
        </View>

        <Text style={{
          fontFamily,
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary
        }}>
          {submissions.length} {t('exams.submissionsNeedGrading')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, padding: designTokens.spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {submissions.length === 0 ? (
          <View style={{
            alignItems: 'center',
            paddingVertical: 40,
            backgroundColor: colors.backgroundElevated,
            borderRadius: designTokens.borderRadius.xl,
            ...designTokens.shadows.sm
          }}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={{
              fontFamily,
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: '600',
              color: colors.textPrimary,
              marginTop: designTokens.spacing.md
            }}>
              {t('exams.noSubmissionsNeedGrading')}
            </Text>
            <Text style={{
              fontFamily,
              fontSize: designTokens.typography.body.fontSize,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: designTokens.spacing.xs,
              paddingHorizontal: designTokens.spacing.xl
            }}>
              {t('exams.allSubmissionsGraded')}
            </Text>
          </View>
        ) : (
          // In app/(teacher)/exams/grading/index.tsx - Update the submission display
          submissions.map((submission) => (
            <TouchableOpacity
              key={submission.id}
              style={{
                backgroundColor: colors.backgroundElevated,
                borderRadius: designTokens.borderRadius.xl,
                padding: designTokens.spacing.lg,
                marginBottom: designTokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                ...designTokens.shadows.sm
              }}
              onPress={() => router.push(`/(teacher)/exams/grading/${submission.id}`)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily,
                    fontSize: designTokens.typography.headline.fontSize,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.xs
                  }}>
                    {submission.exam?.title || 'Unknown Exam'}
                  </Text>
                  <Text style={{
                    fontFamily,
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textSecondary,
                    marginBottom: designTokens.spacing.xxs
                  }}>
                    {submission.exam?.subject || 'Unknown Subject'} • {submission.exam?.class || 'Unknown Class'}
                  </Text>
                  <Text style={{
                    fontFamily,
                    fontSize: designTokens.typography.caption1.fontSize,
                    color: colors.textTertiary
                  }}>
                    Student: {submission.student?.profile?.name || 'Unknown Student'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: designTokens.spacing.md,
                paddingTop: designTokens.spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar" size={16} color={colors.primary} />
                  <Text style={{
                    fontFamily,
                    fontSize: designTokens.typography.caption1.fontSize,
                    color: colors.textSecondary,
                    marginLeft: designTokens.spacing.xs
                  }}>
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: colors.warning + '20',
                  paddingHorizontal: designTokens.spacing.sm,
                  paddingVertical: designTokens.spacing.xs,
                  borderRadius: designTokens.borderRadius.sm
                }}>
                  <Text style={{
                    fontFamily,
                    fontSize: designTokens.typography.caption2.fontSize,
                    color: colors.warning,
                    fontWeight: '500'
                  }}>
                    Needs Grading
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
