// app/(teacher)/exams/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Pressable
} from 'react-native';
import Alert from '@/components/Alert';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../../src/contexts/ThemeContext';
import { designTokens } from '../../../src/utils/designTokens';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { ShareModal } from '@/components/ShareModal';
import { generateExamLink } from '@/utils/linking';

const { width } = Dimensions.get('window');

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
  const { user } = useAuth();
  const { colors, isDark } = useThemeContext();
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'submissions'>('overview');
  const [showShareModal, setShowShareModal] = useState(false);

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
        const examData = response.data.data;
        const examDetails: ExamDetails = {
          ...examData,
          questions: examData.questions || [],
          submissions_count: examData.submissions_count || 0,
          average_score: examData.average_score || 0,
          total_points: examData.total_points || 0,
        };
        setExam(examDetails);
      } else {
        Alert.alert('Error', 'Failed to load exam details');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load exam details:', error);
      Alert.alert('Error', 'Failed to load exam details');
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
      'Delete Exam',
      `Are you sure you want to delete "${exam.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteExam(exam.id);
              if (response.data.success) {
                Alert.alert('Success', 'Exam deleted successfully');
                router.back();
              } else {
                Alert.alert('Error', response.data.error || 'Failed to delete exam');
              }
            } catch (error) {
              console.error('Delete exam error:', error);
              Alert.alert('Error', 'Failed to delete exam');
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
      const response = await apiService.updateExam(exam.id, { is_active: newStatus });

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
                  'exams.activatedTitle', // You'll need to add this key to your translations
                  'exams.activatedBody',  // You'll need to add this key to your translations
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
        Alert.alert('Success', `Exam ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        Alert.alert('Error', response.data.error || 'Failed to update exam status');
      }
    } catch (error) {
      console.error('Toggle exam status error:', error);
      Alert.alert('Error', 'Failed to update exam status');
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
      <Text style={[styles.statValue, { color: color.text }]}>
        {value}
      </Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>
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

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading exam details...
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
        <Text style={[styles.emptyTitle as any, { color: colors.textPrimary }]}>
          Exam not found
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          The exam you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Back to Exams
          </Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title as any, { color: colors.textPrimary }]}>
                {exam.title}
              </Text>
              <View style={styles.subtitleRow}>
                <View style={styles.subtitleItem}>
                  <Ionicons name="book" size={14} color={colors.textSecondary} />
                  <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
                    {exam.subject}
                  </Text>
                </View>
                <View style={styles.dot} />
                <View style={styles.subtitleItem}>
                  <Ionicons name="people" size={14} color={colors.textSecondary} />
                  <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
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
                { color: exam.is_active ? '#10B981' : '#6B7280' }
              ]}>
                {exam.is_active ? 'Active' : 'Inactive'}
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
            { key: 'overview', label: 'Overview', icon: 'grid' },
            { key: 'questions', label: 'Questions', icon: 'help-circle' },
            { key: 'submissions', label: 'Submissions', icon: 'document' },
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
                <Text style={[styles.sectionTitle as any, { color: colors.textPrimary }]}>
                  Exam Overview
                </Text>

                <View style={styles.statsGrid}>
                  <StatCard
                    title="Submissions"
                    value={exam.submissions_count.toString()}
                    icon="document-text"
                    color={{
                      bg: isDark ? '#3B82F620' : '#3B82F610',
                      text: '#3B82F6',
                      icon: '#3B82F6'
                    }}
                  />
                  <StatCard
                    title="Avg Score"
                    value={exam.average_score ? `${formatStatsValue(exam.average_score)}%` : 'N/A'}
                    icon="bar-chart"
                    color={{
                      bg: isDark ? '#10B98120' : '#10B98110',
                      text: '#10B981',
                      icon: '#10B981'
                    }}
                  />
                  <StatCard
                    title="Questions"
                    value={exam.questions?.length.toString() || '0'}
                    icon="help-circle"
                    color={{
                      bg: isDark ? '#8B5CF620' : '#8B5CF610',
                      text: '#8B5CF6',
                      icon: '#8B5CF6'
                    }}
                  />
                  <StatCard
                    title="Total Points"
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
                  <Text style={[styles.settingsTitle as any, { color: colors.textPrimary }]}>
                    Settings
                  </Text>
                  <View style={styles.settingsList}>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
                        Timed Exam
                      </Text>
                      <Text style={[styles.settingValue, { color: colors.textPrimary }]}>
                        {exam.settings?.timed ? `${exam.settings.duration} minutes` : 'No time limit'}
                      </Text>
                    </View>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
                        Allow Retake
                      </Text>
                      <Text style={[styles.settingValue, { color: colors.textPrimary }]}>
                        {exam.settings?.allow_retake ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
                        Random Order
                      </Text>
                      <Text style={[styles.settingValue, { color: colors.textPrimary }]}>
                        {exam.settings?.random_order ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
                        Created
                      </Text>
                      <Text style={[styles.settingValue, { color: colors.textPrimary }]}>
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
                <Text style={[styles.sectionTitle as any, { color: colors.textPrimary }]}>
                  Quick Actions
                </Text>
                <View style={styles.actionsGrid}>
                  <ActionButton
                    title={exam.is_active ? 'Pause Exam' : 'Activate Exam'}
                    icon={exam.is_active ? 'pause' : 'play'}
                    color={exam.is_active ? '#F59E0B' : '#10B981'}
                    onPress={toggleExamStatus}
                  />
                  <ActionButton
                    title="View Results"
                    icon="bar-chart"
                    color="#3B82F6"
                    onPress={() => router.push(`/(teacher)/exam-results/${exam.id}`)}
                  />
                  <ActionButton
                    title="Share Exam"
                    icon="share"
                    color="#8B5CF6"
                    onPress={() => setShowShareModal(true)}
                  />
                  <ActionButton
                    title="Analytics"
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
                  <Text style={[styles.sectionTitle as any, { color: colors.textPrimary }]}>
                    Questions
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    {exam.questions?.length || 0} questions • {getTotalPoints()} points
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
                          <Text style={[styles.questionNumber, { color: colors.textSecondary }]}>
                            {index + 1}.
                          </Text>
                          <Text style={[styles.questionText, { color: colors.textPrimary }]}>
                            {question.question}
                          </Text>
                          <View style={[
                            styles.pointsBadge,
                            {
                              backgroundColor: '#3B82F615',
                              borderColor: '#3B82F630'
                            }
                          ]}>
                            <Text style={[styles.pointsText, { color: '#3B82F6' }]}>
                              {question.points} pt{question.points !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.questionMeta}>
                          <Text style={[styles.questionType, { color: colors.textSecondary }]}>
                            Type: <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                              {question.type}
                            </Text>
                          </Text>
                        </View>

                        {question.type === 'mcq' && question.options && (
                          <View style={styles.optionsContainer}>
                            <Text style={[styles.optionsTitle, { color: colors.textSecondary }]}>
                              Options:
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
                              borderLeftColor: '#3B82F6'
                            }
                          ]}>
                            <View style={styles.explanationHeader}>
                              <Ionicons name="information-circle" size={14} color="#3B82F6" />
                              <Text style={[styles.explanationTitle, { color: '#3B82F6' }]}>
                                Explanation
                              </Text>
                            </View>
                            <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
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
                    <Text style={[styles.emptyTitle as any, { color: colors.textPrimary }]}>
                      No questions added
                    </Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Add questions to this exam to get started
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {activeTab === 'submissions' && (
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
                  <Text style={[styles.sectionTitle as any, { color: colors.textPrimary }]}>
                    Submissions
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    {exam.submissions_count || 0} submissions
                  </Text>
                </View>

                {exam.submissions_count > 0 ? (
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push(`/(teacher)/exam-results/${exam.id}`)}
                  >
                    <Ionicons name="bar-chart" size={20} color="white" />
                    <Text style={styles.primaryButtonText}>View All Results</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyState}>
                    <View style={[
                      styles.emptyIconContainer,
                      { backgroundColor: isDark ? '#37415130' : '#E5E7EB' }
                    ]}>
                      <Ionicons name="document" size={48} color={colors.textTertiary} />
                    </View>
                    <Text style={[styles.emptyTitle as any, { color: colors.textPrimary }]}>
                      No submissions yet
                    </Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Student submissions will appear here once they take the exam
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>

      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`Exam: ${exam?.title || 'Exam'}`}
        link={generateExamLink(
          exam?.id || '',
          { subject: exam?.subject, title: exam?.title }
        )}
        subject={exam?.subject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  backButtonText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginLeft: designTokens.spacing.xs,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginRight: designTokens.spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: designTokens.spacing.xs,
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: designTokens.spacing.xs,
  },
  subtitleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginLeft: designTokens.spacing.xs,
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
    flexDirection: 'row',
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
    flexDirection: 'row',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.xs,
    marginTop: designTokens.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: designTokens.typography.footnote.fontSize,
    marginLeft: designTokens.spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingBottom: designTokens.spacing.xxxl,
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
  },
  sectionSubtitle: {
    fontSize: designTokens.typography.body.fontSize,
    opacity: 0.7,
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
  },
  statTitle: {
    fontSize: designTokens.typography.caption1.fontSize,
    opacity: 0.8,
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
  },
  settingsList: {
    gap: designTokens.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: designTokens.typography.body.fontSize,
    opacity: 0.8,
  },
  settingValue: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  actionButtonText: {
    fontSize: designTokens.typography.body.fontSize,
    marginLeft: designTokens.spacing.xs,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.md,
  },
  questionNumber: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginRight: designTokens.spacing.xs,
    marginTop: designTokens.spacing.xs,
  },
  questionText: {
    flex: 1,
    fontSize: designTokens.typography.body.fontSize,
    lineHeight: 22,
    marginRight: designTokens.spacing.sm,
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
  },
  optionsContainer: {
    marginBottom: designTokens.spacing.md,
  },
  optionsTitle: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xs,
  },
  optionIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginRight: designTokens.spacing.sm,
  },
  optionText: {
    fontSize: designTokens.typography.body.fontSize,
    flex: 1,
  },
  explanationContainer: {
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    borderLeftWidth: 3,
    marginTop: designTokens.spacing.sm,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xs,
  },
  explanationTitle: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
    marginLeft: designTokens.spacing.xs,
  },
  explanationText: {
    fontSize: designTokens.typography.caption1.fontSize,
    lineHeight: 18,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginLeft: designTokens.spacing.xs,
  },
} as any);
