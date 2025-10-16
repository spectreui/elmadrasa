// app/(teacher)/homework/index.tsx - Updated with Full Dark Mode Support
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '../../../src/utils/designTokens';
import { router } from 'expo-router';
import { Alert } from '@/utils/UniversalAlert';

interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  due_date: string;
  points: number;
  attachments: boolean;
  teacher_id: string;
  created_at: string;
  updated_at: string;
  submissions_count?: number;
  graded_count?: number;
  average_score?: number;
}

export default function TeacherHomeworkScreen() {
  const { user, isAuthenticated } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useThemeContext();
  

  const loadHomework = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTeacherHomework();

      if (response.data.success) {
        setHomework(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to load homework');
      }
    } catch (error: any) {
      console.error('Failed to load homework:', error);
      Alert.alert('Error', error.message || 'Failed to load homework assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHomework();
  };

  const getSubmissionStats = (homeworkItem: Homework) => {
    const totalStudents = 25; // This should come from your database
    const submitted = homeworkItem.submissions_count || 0;
    const graded = homeworkItem.graded_count || 0;
    const pending = submitted - graded;

    return {
      totalStudents,
      submitted,
      graded,
      pending,
      submissionRate: Math.round((submitted / totalStudents) * 100),
      averageScore: homeworkItem.average_score || 0
    };
  };

  const getStatusColor = (submissionRate: number) => {
    if (submissionRate >= 80) return colors.success;
    if (submissionRate >= 50) return colors.warning;
    return colors.error;
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleHomeworkPress = (homeworkItem: Homework) => {
    router.push(`/homework/${homeworkItem.id}/submissions`);
  };

  const handleCreateHomework = () => {
    router.push('/homework/create');
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading homework...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Homework
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Manage and grade assignments
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.newButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateHomework}
          >
            <Ionicons name="add" size={22} color="white" />
            <Text style={styles.newButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Overview */}
        <View style={[styles.statsOverview, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
          <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {homework.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {homework.reduce((acc, hw) => acc + (hw.submissions_count || 0), 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Submissions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {homework.reduce((acc, hw) => acc + (hw.graded_count || 0), 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Graded</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {homework.length > 0
                  ? Math.round(homework.reduce((acc, hw) => acc + (hw.average_score || 0), 0) / homework.length)
                  : 0}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg. Score</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.homeworkList}>
          {homework.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <Ionicons name="document-text-outline" size={80} color={colors.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                No Homework Yet
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
                Create your first homework assignment to get started
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateHomework}
              >
                <Text style={styles.createButtonText}>Create Homework</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.homeworkGrid}>
              {homework.map((item) => {
                const stats = getSubmissionStats(item);
                const isOverdue = new Date(item.due_date) < new Date();

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.homeworkCard,
                      {
                        backgroundColor: colors.backgroundElevated,
                        borderColor: isOverdue ? colors.error : colors.primary,
                        ...designTokens.shadows.sm
                      }
                    ]}
                    onPress={() => handleHomeworkPress(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTextContainer}>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                          {item.description}
                        </Text>
                        <View style={styles.tagContainer}>
                          <View style={[styles.tag, { backgroundColor: `${colors.textTertiary}20` }]}>
                            <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                              {item.subject}
                            </Text>
                          </View>
                          <View style={[styles.tag, { backgroundColor: `${colors.textTertiary}20` }]}>
                            <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                              {item.class}
                            </Text>
                          </View>
                          <View style={[styles.tag, { backgroundColor: `${colors.textTertiary}20` }]}>
                            <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                              {item.points} points
                            </Text>
                          </View>
                          {isOverdue && (
                            <View style={[styles.tag, { backgroundColor: `${colors.error}20` }]}>
                              <Text style={[styles.tagText, { color: colors.error }]}>
                                Overdue
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isOverdue ? colors.error : colors.primary}
                      />
                    </View>

                    {/* Progress Bars */}
                    <View style={styles.progressContainer}>
                      {/* Submission Progress */}
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressHeader}>
                          <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>
                            Submissions
                          </Text>
                          <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                            {stats.submitted}/{stats.totalStudents} ({stats.submissionRate}%)
                          </Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                backgroundColor: getStatusColor(stats.submissionRate),
                                width: `${stats.submissionRate}%`
                              }
                            ]}
                          />
                        </View>
                      </View>

                      {/* Grading Progress */}
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressHeader}>
                          <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>
                            Grading Progress
                          </Text>
                          <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                            {stats.graded}/{stats.submitted} graded
                          </Text>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                backgroundColor: colors.success,
                                width: `${stats.submitted > 0 ? (stats.graded / stats.submitted) * 100 : 0}%`
                              }
                            ]}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Footer Info */}
                    <View style={styles.cardFooter}>
                      <View style={styles.footerInfo}>
                        <View style={styles.footerItem}>
                          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
                          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                            Due: {formatDueDate(item.due_date)}
                          </Text>
                        </View>
                        {stats.averageScore > 0 && (
                          <View style={styles.footerItem}>
                            <Ionicons name="trophy" size={16} color={colors.warning} />
                            <Text style={[styles.footerText, { color: colors.warning }]}>
                              Avg: {stats.averageScore}%
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.viewText, { color: colors.primary }]}>
                        View Submissions →
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  } as any,
  header: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.lg,
  } as any,
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.xl,
  } as any,
  headerText: {
    flex: 1,
  } as any,
  headerTitle: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight as any,
    marginBottom: designTokens.spacing.xs,
  } as any,
  headerSubtitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  } as any,
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    ...designTokens.shadows.sm,
  } as any,
  newButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize,
    marginLeft: designTokens.spacing.xs,
  } as any,
  statsOverview: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    ...designTokens.shadows.sm,
  } as any,
  statsTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.md,
  } as any,
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as any,
  statItem: {
    alignItems: 'center',
  } as any,
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
    marginBottom: designTokens.spacing.xxs,
  } as any,
  statLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
  } as any,
  content: {
    flex: 1,
  } as any,
  homeworkList: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingBottom: designTokens.spacing.xl,
  } as any,
  emptyState: {
    alignItems: 'center',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.xxxl,
    borderWidth: 1,
  } as any,
  emptyStateTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.xs,
  } as any,
  emptyStateSubtitle: {
    fontSize: designTokens.typography.footnote.fontSize,
    textAlign: 'center',
    marginBottom: designTokens.spacing.lg,
  } as any,
  createButton: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    ...designTokens.shadows.sm,
  } as any,
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize,
  } as any,
  homeworkGrid: {
    gap: designTokens.spacing.sm,
  } as any,
  homeworkCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
  } as any,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.md,
  } as any,
  cardTextContainer: {
    flex: 1,
    marginRight: designTokens.spacing.md,
  } as any,
  cardTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs,
  } as any,
  cardDescription: {
    fontSize: designTokens.typography.body.fontSize,
    marginBottom: designTokens.spacing.md,
  } as any,
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap' as 'wrap',
    gap: designTokens.spacing.xs,
  } as any,
  tag: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xxs,
    borderRadius: designTokens.borderRadius.full,
  } as any,
  tagText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600',
  } as any,
  progressContainer: {
    marginBottom: designTokens.spacing.md,
    gap: designTokens.spacing.md,
  } as any,
  progressBarContainer: {
    gap: designTokens.spacing.xs,
  } as any,
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as any,
  progressTitle: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600',
  } as any,
  progressSubtitle: {
    fontSize: designTokens.typography.caption1.fontSize,
  } as any,
  progressBar: {
    height: 8,
    borderRadius: designTokens.borderRadius.full,
    overflow: 'hidden',
  } as any,
  progressFill: {
    height: '100%',
    borderRadius: designTokens.borderRadius.full,
  } as any,
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as any,
  footerInfo: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
  } as any,
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  } as any,
  footerText: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginLeft: designTokens.spacing.xxs,
  } as any,
  viewText: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600',
  } as any,
};
