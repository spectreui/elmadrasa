// app/(teacher)/exams/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet
} from 'react-native';
import Alert from '@/components/Alert';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '@/utils/designTokens';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { ShareModal } from '@/components/ShareModal';
import { generateExamLink } from '@/utils/linking';
import { useTranslation } from '@/hooks/useTranslation';

interface ExamDetails {
  id: string;
  title: string;
  subject: string;
  class: string;
  is_active: boolean;
  created_at: string;
  settings?: {
    timed?: boolean;
    duration?: number;
    allow_retake?: boolean;
    random_order?: boolean;
  };
  questions: any[];
  submissions_count: number;
  average_score: number;
  total_points: number;
}

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams();
  const { fontFamily, colors, isDark } = useThemeContext();
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'submissions'>('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const { t, isRTL } = useTranslation();
  const [submissionsData, setSubmissionsData] = useState(null);

  useEffect(() => {
    if (id) {
      loadExamDetails();
    }
  }, [id]);

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExamById(id as string);

      if (response.data.success && response.data.data) {
        console.log(response.data.data);
        const submissionsResponse = await apiService.getTeacherExamResults(response.data.data.id as string);
        console.log(submissionsResponse.data.data)
        const examData = response.data.data;
        const examDetails: ExamDetails = {
          ...examData,
          questions: examData.questions || [],
          submissions_count: examData.submissions_count || 0,
          average_score: examData.average_score || 0,
          total_points: examData.total_points || 0,
        };
        setExam(examDetails);
        setSubmissionsData(response.data.data.submissions);
      } else {
        Alert.alert(t('common.error'), t('exams.loadFailed'));
        router.back();
      }
    } catch (error) {
      console.error('Failed to load exam details:', error);
      Alert.alert(t('common.error'), t('exams.loadFailed'));
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExamDetails();
  };

  const deleteExam = () => {
    if (!exam) return;

    Alert.alert(
      t('exams.deleteConfirm'),
      `${t('common.confirm')} "${exam.title}"? ${t('common.deleteConfirm')}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteExam(exam.id);
              if (response.data.success) {
                Alert.alert(t('common.success'), t('exams.deleteSuccess'));
                router.back();
              } else {
                Alert.alert(t('common.error'), response.data.error || t('exams.deleteFailed'));
              }
            } catch (error) {
              console.error('Delete exam error:', error);
              Alert.alert(t('common.error'), t('exams.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const toggleExamStatus = async () => {
    if (!exam) return;

    try {
      const newStatus = !exam.is_active;
      console.log(exam.id + "./" + newStatus)
      const response = await apiService.updateExamStatus(exam.id, { is_active: newStatus });

      if (response.data.success) {
        setExam(prev => prev ? { ...prev, is_active: newStatus } : null);

        // Send push notification when exam status changes
        if (newStatus) {
          try {
            const submissionsResponse = await apiService.getExamSubmissions(exam.id);
            if (submissionsResponse.data.success) {
              const submissions = submissionsResponse.data.data || [];
              const studentIds = [...new Set(submissions.map((sub: any) => sub.student_id))];

              // Send localized bulk notification to all students
              try {
                await apiService.sendBulkLocalizedNotifications(
                  studentIds,
                  'exams.activatedTitle',
                  'exams.activatedBody',
                  {
                    title: exam.title
                  },
                  {
                    screen: 'exam',
                    examId: exam.id,
                    type: 'exam_activated'
                  }
                );
                console.log(`✅ Sent localized exam activation notifications to ${studentIds.length} students`);
              } catch (notificationError) {
                console.log('Failed to send bulk exam activation notifications:', notificationError);
                // Fallback: try individual notifications
                for (const studentId of studentIds) {
                  try {
                    await apiService.sendLocalizedNotification(
                      studentId,
                      'exams.activatedTitle',
                      'exams.activatedBody',
                      {
                        title: exam.title
                      },
                      {
                        screen: 'exam',
                        examId: exam.id,
                        type: 'exam_activated'
                      }
                    );
                  } catch (individualError) {
                    console.log(`Failed to notify student ${studentId}:`, individualError);
                  }
                }
              }
            }
          } catch (error) {
            console.log('Failed to send exam activation notifications:', error);
          }
        }
        Alert.alert(t('common.success'), t(`exams.${newStatus ? 'activatedSuccess' : 'deactivatedSuccess'}`));
      } else {
        Alert.alert(t('common.error'), response.data.error || t('exams.updateFailed'));
        console.log(exam.id + "./" + !exam.is_active);
      }
    } catch (error) {
      console.error('Toggle exam status error:', error);

      console.log(exam.id + "./" + !exam.is_active);
      Alert.alert(t('common.error'), t('exams.updateFailed'));
    }
  };

  const getTotalPoints = () => {
    if (!exam?.questions) return 0;
    return exam.questions.reduce((sum, question) => sum + question.points, 0);
  };

  const formatStatsValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(1);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: 40
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: designTokens.spacing.xl,
    },
    loadingText: {
      marginTop: designTokens.spacing.md,
      fontSize: designTokens.typography.body.fontSize,
    },
    header: {
      paddingTop: designTokens.spacing.xxxl,
      paddingHorizontal: designTokens.spacing.xl,
      paddingBottom: designTokens.spacing.lg,
      borderBottomWidth: 1,
    },
    backButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: designTokens.spacing.lg,
    },
    backButtonText: {
      fontSize: designTokens.typography.body.fontSize,
      fontWeight: '600',
      [isRTL ? 'marginRight' : 'marginLeft']: designTokens.spacing.xs,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    titleRow: {
      flex: 1,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginHorizontal: isRTL ? designTokens.spacing.md : designTokens.spacing.sm,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      marginBottom: designTokens.spacing.xs,
      letterSpacing: -0.3,
      textAlign: isRTL ? 'right' : 'left',
    },
    subtitleRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginTop: designTokens.spacing.xs,
    },
    subtitleItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    subtitleText: {
      fontSize: designTokens.typography.caption1.fontSize,
      marginHorizontal: designTokens.spacing.xs,
      opacity: 0.8,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(156, 163, 175, 0.5)',
      marginHorizontal: designTokens.spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: designTokens.spacing.md,
      paddingVertical: designTokens.spacing.xs,
      borderRadius: designTokens.borderRadius.full,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: designTokens.typography.caption2.fontSize,
      fontWeight: '600',
    },
    actionButtonsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: designTokens.spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: designTokens.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabsContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.xs,
      marginTop: designTokens.spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: designTokens.spacing.md,
      borderRadius: designTokens.borderRadius.lg,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabText: {
      fontSize: designTokens.typography.footnote.fontSize,
      marginHorizontal: designTokens.spacing.xs,
    },
    content: {
      flex: 1,
    },
    contentPadding: {
      paddingHorizontal: designTokens.spacing.xl,
      paddingBottom: 65,
      paddingTop: designTokens.spacing.xxxxl,
    },
    section: {
      borderRadius: designTokens.borderRadius.xxl,
      padding: designTokens.spacing.lg,
      marginBottom: designTokens.spacing.lg,
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: designTokens.spacing.lg,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: designTokens.spacing.xs,
      textAlign: isRTL ? 'right' : 'left',
    },
    sectionSubtitle: {
      fontSize: designTokens.typography.body.fontSize,
      opacity: 0.7,
      textAlign: isRTL ? 'right' : 'left',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: designTokens.spacing.sm,
      marginBottom: designTokens.spacing.lg,
    },
    statCard: {
      width: '48%',
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.lg,
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    statIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: designTokens.spacing.md,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: designTokens.spacing.xs,
      textAlign: isRTL ? 'right' : 'left',
    },
    statTitle: {
      fontSize: designTokens.typography.caption1.fontSize,
      opacity: 0.8,
      textAlign: isRTL ? 'right' : 'left',
    },
    settingsSection: {
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(0,0,0,0.05)',
      paddingTop: designTokens.spacing.lg,
    },
    settingsTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: designTokens.spacing.md,
      textAlign: isRTL ? 'right' : 'left',
    },
    settingsList: {
      gap: designTokens.spacing.md,
    },
    settingRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settingLabel: {
      fontSize: designTokens.typography.body.fontSize,
      opacity: 0.8,
      textAlign: isRTL ? 'right' : 'left',
    },
    settingValue: {
      fontSize: designTokens.typography.body.fontSize,
      fontWeight: '500',
      textAlign: isRTL ? 'right' : 'left',
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: designTokens.spacing.sm,
    },
    actionButton: {
      width: '48%',
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.lg,
      borderWidth: 1,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: designTokens.spacing.sm,
    },
    actionButtonText: {
      fontSize: designTokens.typography.body.fontSize,
      [isRTL ? 'marginRight' : 'marginLeft']: designTokens.spacing.xs,
    },
    questionsList: {
      gap: designTokens.spacing.md,
    },
    questionCard: {
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.lg,
      borderWidth: 1,
    },
    questionHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      marginBottom: designTokens.spacing.md,
    },
    questionText: {
      flex: 1,
      fontSize: designTokens.typography.body.fontSize,
      lineHeight: 22,
      marginHorizontal: designTokens.spacing.xs,
      textAlign: isRTL ? 'right' : 'left',
    },
    questionNumber: {
      fontSize: designTokens.typography.body.fontSize,
      fontWeight: '600',
      marginRight: isRTL ? 0 : designTokens.spacing.xs,
      marginLeft: isRTL ? designTokens.spacing.xs : 0,
      marginTop: designTokens.spacing.xs,
    },
    pointsBadge: {
      paddingHorizontal: designTokens.spacing.sm,
      paddingVertical: designTokens.spacing.xs,
      borderRadius: designTokens.borderRadius.full,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    pointsText: {
      fontSize: designTokens.typography.caption2.fontSize,
      fontWeight: '600',
    },
    questionMeta: {
      marginBottom: designTokens.spacing.md,
    },
    questionType: {
      fontSize: designTokens.typography.caption1.fontSize,
      textAlign: isRTL ? 'right' : 'left',
    },
    optionsContainer: {
      marginBottom: designTokens.spacing.md,
    },
    optionsTitle: {
      fontSize: designTokens.typography.caption1.fontSize,
      fontWeight: '600',
      marginBottom: designTokens.spacing.xs,
      textAlign: isRTL ? 'right' : 'left',
    },
    optionRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: designTokens.spacing.xs,
    },
    optionIndicator: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      marginHorizontal: designTokens.spacing.sm,
    },
    optionText: {
      fontSize: designTokens.typography.body.fontSize,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    explanationContainer: {
      padding: designTokens.spacing.md,
      borderRadius: designTokens.borderRadius.lg,
      [isRTL ? 'borderRightWidth' : 'borderLeftWidth']: 3,
      marginTop: designTokens.spacing.sm,
    },
    explanationHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: designTokens.spacing.xs,
    },
    explanationTitle: {
      fontSize: designTokens.typography.caption1.fontSize,
      fontWeight: '600',
      marginHorizontal: designTokens.spacing.xs,
    },
    explanationText: {
      fontSize: designTokens.typography.caption1.fontSize,
      lineHeight: 18,
      textAlign: isRTL ? 'right' : 'left',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: designTokens.spacing.xxl,
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: designTokens.spacing.lg,
    },
    emptyTitle: {
      fontSize: designTokens.typography.title3.fontSize,
      fontWeight: designTokens.typography.title3.fontWeight,
      marginBottom: designTokens.spacing.xs,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: designTokens.typography.body.fontSize,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 280,
      opacity: 0.7,
      marginBottom: designTokens.spacing.lg,
    },
    primaryButton: {
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.lg,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButtonText: {
      color: 'white',
      fontSize: designTokens.typography.body.fontSize,
      fontWeight: '600',
      [isRTL ? 'marginRight' : 'marginLeft']: designTokens.spacing.xs,
    },
  });

  const StatCard = ({
    title,
    value,
    icon,
    color
  }: {
    title: string;
    value: string;
    icon: string;
    color: { bg: string; text: string; icon: string }
  }) => (
    <View style={[
      styles.statCard,
      {
        backgroundColor: color.bg,
        ...designTokens.shadows.sm,
      }
    ]}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon as any} size={20} color={color.icon} />
      </View>
      <Text style={[styles.statValue, { fontFamily, color: color.text }]}>
        {value}
      </Text>
      <Text style={[styles.statTitle, { fontFamily, color: colors.textSecondary }]}>
        {title}
      </Text>
    </View>
  );

  const ActionButton = ({
    title,
    icon,
    color,
    onPress,
    variant = 'primary'
  }: {
    title: string;
    icon: string;
    color: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
  }) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        variant === 'primary'
          ? {
            backgroundColor: color + '15',
            borderColor: color + '30'
          }
          : {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.border
          }
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={variant === 'primary' ? color : colors.textSecondary}
      />
      <Text style={[
        styles.actionButtonText,
        {
          color: variant === 'primary' ? color : colors.textPrimary,
          fontWeight: variant === 'primary' ? '600' : '500'
        }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const viewSubmissionDetails = (submissionId) => {
  // Navigate to submission details page or open modal
  router.push(`/(teacher)/exams/grading/${submissionId}`);
  // Or open a modal with submission details
};

const gradeSubmission = (submissionId) => {
  // Navigate to manual grading page
  router.push(`/(teacher)/exams/grading/${submissionId}`);
  // Or open grading modal
};

  // Add this to your exam page component
  const SubmissionsTab = () => {
    if (!submissionsData) {
      return <div className="text-center py-8">Loading submissions...</div>;
    }

    const { statistics, scoreDistribution, submissions } = submissionsData;

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Submissions</h3>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalSubmissions}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
            <p className="text-2xl font-bold text-blue-600">{statistics.averageScore}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Highest Score</h3>
            <p className="text-2xl font-bold text-green-600">{statistics.highestScore}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Lowest Score</h3>
            <p className="text-2xl font-bold text-red-600">{statistics.lowestScore}%</p>
          </div>
        </div>

        {/* Score Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
          <div className="space-y-2">
            {scoreDistribution.map((range) => (
              <div key={range.range} className="flex items-center">
                <span className="w-16 text-sm font-medium">{range.range}%</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full"
                    style={{ width: `${(range.count / statistics.totalSubmissions) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium w-8">{range.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Student Submissions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {submission.student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.student.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.student.class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.score} / {submission.totalPoints}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${submission.percentage >= 80
                            ? 'bg-green-100 text-green-800'
                            : submission.percentage >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {submission.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.needs_manual_grading ? (
                        submission.is_manually_graded ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                            Manually Graded
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
                            Needs Grading
                          </span>
                        )
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                          Auto Graded
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewSubmissionDetails(submission.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      {submission.needs_manual_grading && !submission.is_manually_graded && (
                        <button
                          onClick={() => gradeSubmission(submission.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Grade
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {submissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No submissions yet
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontFamily, color: colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (!exam) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <View style={[
          styles.emptyIconContainer,
          { backgroundColor: isDark ? '#37415130' : '#E5E7EB' }
        ]}>
          <Ionicons name="document-text" size={48} color={colors.textTertiary} />
        </View>
        <Text style={[styles.emptyTitle as any, { fontFamily, color: colors.textPrimary }]}>
          {t('exams.noResultsFound')}
        </Text>
        <Text style={[styles.emptyText, { fontFamily, color: colors.textSecondary }]}>
          {t('exams.resultsLoadFailed')}
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { fontFamily, backgroundColor: colors.background }] as any}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          backgroundColor: colors.backgroundElevated,
          borderBottomColor: colors.border
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.backButtonText, { fontFamily, color: colors.primary }]}>
            {t('common.goBack')}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title as any, { fontFamily, color: colors.textPrimary }]}>
                {exam.title}
              </Text>
              <View style={styles.subtitleRow}>
                <View style={styles.subtitleItem}>
                  <Ionicons name="book" size={14} color={colors.textSecondary} />
                  <Text style={[styles.subtitleText, { fontFamily, color: colors.textSecondary }]}>
                    {exam.subject}
                  </Text>
                </View>
                <View style={styles.dot} />
                <View style={styles.subtitleItem}>
                  <Ionicons name="people" size={14} color={colors.textSecondary} />
                  <Text style={[styles.subtitleText, { fontFamily, color: colors.textSecondary }]}>
                    {exam.class}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[
              styles.statusBadge,
              {
                backgroundColor: exam.is_active ? '#10B98115' : '#6B728015',
                borderColor: exam.is_active ? '#10B98130' : '#6B728030'
              }
            ]}>
              <Text style={[
                styles.statusText,
                { fontFamily, color: exam.is_active ? '#10B981' : '#6B7280' }
              ]}>
                {exam.is_active ? t('common.active') : t('exams.inactive')}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: '#3B82F615' }]}
              onPress={() => router.push(`/(teacher)/create-exam?edit=${exam.id}`)}
            >
              <Ionicons name="create" size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: '#EF444415' }]}
              onPress={deleteExam}
            >
              <Ionicons name="trash" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={[
          styles.tabsContainer,
          { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }
        ]}>
          {([
            { key: 'overview', label: t('dashboard.overview'), icon: 'grid' },
            { key: 'questions', label: t('exams.questions'), icon: 'help-circle' },
            { key: 'submissions', label: t('submissions.title'), icon: 'document' },
          ] as const).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && {
                  backgroundColor: colors.backgroundElevated,
                  ...designTokens.shadows.sm,
                }
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                    fontWeight: activeTab === tab.key ? '600' : '500'
                  }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        entering={FadeInUp.duration(400)}
      >
        <View style={styles.contentPadding}>
          {activeTab === 'overview' && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              layout={Layout.springify()}
            >
              {/* Exam Stats */}
              <View style={[
                styles.section,
                {
                  backgroundColor: colors.backgroundElevated,
                  ...designTokens.shadows.sm,
                }
              ]}>
                <Text style={[styles.sectionTitle as any, { fontFamily, color: colors.textPrimary }]}>
                  {t('dashboard.overview')}
                </Text>

                <View style={styles.statsGrid}>
                  <StatCard
                    title={t('submissions.title')}
                    value={exam.submissions_count.toString()}
                    icon="document-text"
                    color={{
                      bg: isDark ? '#3B82F620' : '#3B82F610',
                      text: '#3B82F6',
                      icon: '#3B82F6'
                    }}
                  />
                  <StatCard
                    title={t('dashboard.avgScore')}
                    value={exam.average_score ? `${formatStatsValue(exam.average_score)}%` : t('profile.na')}
                    icon="bar-chart"
                    color={{
                      bg: isDark ? '#10B98120' : '#10B98110',
                      text: '#10B981',
                      icon: '#10B981'
                    }}
                  />
                  <StatCard
                    title={t('exams.questions')}
                    value={exam.questions?.length.toString() || '0'}
                    icon="help-circle"
                    color={{
                      bg: isDark ? '#8B5CF620' : '#8B5CF610',
                      text: '#8B5CF6',
                      icon: '#8B5CF6'
                    }}
                  />
                  <StatCard
                    title={t('common.points')}
                    value={getTotalPoints().toString()}
                    icon="star"
                    color={{
                      bg: isDark ? '#F59E0B20' : '#F59E0B10',
                      text: '#F59E0B',
                      icon: '#F59E0B'
                    }}
                  />
                </View>

                {/* Exam Settings */}
                <View style={styles.settingsSection}>
                  <Text style={[styles.settingsTitle as any, { fontFamily, color: colors.textPrimary }]}>
                    {t('exams.settings')}
                  </Text>
                  <View style={styles.settingsList}>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingLabel, { fontFamily, color: colors.textSecondary }]}>
                        {t('exams.timed')}
                      </Text>
                      <Text style={[styles.settingValue, { fontFamily, color: colors.textPrimary }]}>
                        {exam.settings?.timed ? `${exam.settings.duration} ${t('exams.minutes')}` : t('exams.untimed')}
                      </Text>
                    </View>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingLabel, { fontFamily, color: colors.textSecondary }]}>
                        {t('exams.allowRetake')}
                      </Text>
                      <Text style={[styles.settingValue, { fontFamily, color: colors.textPrimary }]}>
                        {exam.settings?.allow_retake ? t('common.yes') : t('common.no')}
                      </Text>
                    </View>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingLabel, { fontFamily, color: colors.textSecondary }]}>
                        {t('exams.randomOrder')}
                      </Text>
                      <Text style={[styles.settingValue, { fontFamily, color: colors.textPrimary }]}>
                        {exam.settings?.random_order ? t('common.yes') : t('common.no')}
                      </Text>
                    </View>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingLabel, { fontFamily, color: colors.textSecondary }]}>
                        {t('profile.accountCreated')}
                      </Text>
                      <Text style={[styles.settingValue, { fontFamily, color: colors.textPrimary }]}>
                        {new Date(exam.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={[
                styles.section,
                {
                  backgroundColor: colors.backgroundElevated,
                  ...designTokens.shadows.sm,
                }
              ]}>
                <Text style={[styles.sectionTitle as any, { fontFamily, color: colors.textPrimary }]}>
                  {t('dashboard.quickActions')}
                </Text>
                <View style={styles.actionsGrid}>
                  <ActionButton
                    title={exam.is_active ? t('exams.inactive') : t('exams.active')}
                    icon={exam.is_active ? 'pause' : 'play'}
                    color={exam.is_active ? '#F59E0B' : '#10B981'}
                    onPress={toggleExamStatus}
                  />
                  <ActionButton
                    title={t('exams.examAnalytics')}
                    icon="bar-chart"
                    color="#3B82F6"
                    onPress={() => router.push(`/(teacher)/exam-results/${exam.id}`)}
                  />
                  <ActionButton
                    title={t('common.share')}
                    icon="share"
                    color="#8B5CF6"
                    onPress={() => setShowShareModal(true)}
                  />
                  <ActionButton
                    title={t('dashboard.analytics')}
                    icon="analytics"
                    color="#F97316"
                    onPress={() => router.push('/(teacher)/statistics')}
                    variant="secondary"
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {activeTab === 'questions' && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              layout={Layout.springify()}
            >
              <View style={[
                styles.section,
                {
                  backgroundColor: colors.backgroundElevated,
                  ...designTokens.shadows.sm,
                }
              ]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle as any, { fontFamily, color: colors.textPrimary }]}>
                    {t('exams.questions')}
                  </Text>
                  <Text style={[styles.sectionSubtitle, { fontFamily, color: colors.textSecondary }]}>
                    {exam.questions?.length || 0} {t('exams.questions')} • {getTotalPoints()} {t('common.points')}
                  </Text>
                </View>

                {exam.questions && exam.questions.length > 0 ? (
                  <View style={styles.questionsList}>
                    {exam.questions.map((question, index) => (
                      <Animated.View
                        key={question.id}
                        style={[
                          styles.questionCard,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border
                          }
                        ]}
                        entering={FadeInUp.delay(index * 50)}
                        layout={Layout.springify()}
                      >
                        <View style={styles.questionHeader}>
                          <Text style={[styles.questionNumber, { fontFamily, color: colors.textSecondary }]}>
                            {index + 1}.
                          </Text>
                          <Text style={[styles.questionText, { fontFamily, color: colors.textPrimary }]}>
                            {question.question}
                          </Text>
                          <View style={[
                            styles.pointsBadge,
                            {
                              backgroundColor: '#3B82F615',
                              borderColor: '#3B82F630'
                            }
                          ]}>
                            <Text style={[styles.pointsText, { fontFamily, color: '#3B82F6' }]}>
                              {question.points} {t('common.points')}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.questionMeta}>
                          <Text style={[styles.questionType, { fontFamily, color: colors.textSecondary }]}>
                            {t('homework.questionType')}: <Text style={{ fontFamily, color: colors.textPrimary, fontWeight: '600' }}>
                              {question.type}
                            </Text>
                          </Text>
                        </View>

                        {question.type === 'mcq' && question.options && (
                          <View style={styles.optionsContainer}>
                            <Text style={[styles.optionsTitle, { fontFamily, color: colors.textSecondary }]}>
                              {t('exams.options')}:
                            </Text>
                            {question.options.map((option: string, optIndex: number) => (
                              <View key={optIndex} style={styles.optionRow}>
                                <View style={[
                                  styles.optionIndicator,
                                  {
                                    backgroundColor: option === question.correct_answer
                                      ? '#10B981'
                                      : isDark ? '#374151' : '#E5E7EB',
                                    borderColor: option === question.correct_answer
                                      ? '#10B981'
                                      : colors.border
                                  }
                                ]} />
                                <Text style={[
                                  styles.optionText,
                                  {
                                    color: option === question.correct_answer
                                      ? '#10B981'
                                      : colors.textPrimary,
                                    fontWeight: option === question.correct_answer ? '600' : '400'
                                  }
                                ]}>
                                  {option}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {question.explanation && (
                          <View style={[
                            styles.explanationContainer,
                            {
                              backgroundColor: isDark ? '#1E40AF20' : '#3B82F610',
                              [isRTL ? 'borderRightColor' : 'borderLeftColor']: '#3B82F6'
                            }
                          ]}>
                            <View style={styles.explanationHeader}>
                              <Ionicons name="information-circle" size={14} color="#3B82F6" />
                              <Text style={[styles.explanationTitle, { fontFamily, color: '#3B82F6' }]}>
                                {t('exams.explanation')}
                              </Text>
                            </View>
                            <Text style={[styles.explanationText, { fontFamily, color: colors.textSecondary }]}>
                              {question.explanation}
                            </Text>
                          </View>
                        )}
                      </Animated.View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <View style={[
                      styles.emptyIconContainer,
                      { backgroundColor: isDark ? '#37415130' : '#E5E7EB' }
                    ]}>
                      <Ionicons name="help-circle" size={48} color={colors.textTertiary} />
                    </View>
                    <Text style={[styles.emptyTitle as any, { fontFamily, color: colors.textPrimary }]}>
                      {t('exams.noQuestionsAdded')}
                    </Text>
                    <Text style={[styles.emptyText, { fontFamily, color: colors.textSecondary }]}>
                      {t('exams.addSectionOrQuestion')}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
          {activeTab === 'submissions' && <SubmissionsTab />}
        </View>
      </Animated.ScrollView>

      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`${t('exams.exam')}: ${exam?.title || t('exams.exam')}`}
        link={generateExamLink(
          exam?.id || '',
          { subject: exam?.subject, title: exam?.title }
        )}
        subject={exam?.subject}
      />
    </View>
  );
}