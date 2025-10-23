// app/(teacher)/homework/index.tsx - iOS-like Homework Page
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '../../../src/utils/designTokens';
import { router } from 'expo-router';
import Alert from '@/components/Alert';
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from '@/contexts/AuthContext';

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
  const { t, isRTL } = useTranslation();
  const { isOnline } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { fontFamily, colors } = useThemeContext();

  const loadHomework = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTeacherHomework();

      if (response.data.success) {
        setHomework(response.data.data || []);
      } else {
        throw new Error(response.data.error || t('homework.errors.loadFailed'));
      }
    } catch (error: any) {
      console.error('Failed to load homework:', error);
      Alert.alert(t('common.error'), error.message || t('homework.errors.loadFailed'));
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
      submissionRate: Math.round(submitted / totalStudents * 100),
      averageScore: homeworkItem.average_score || 0
    };
  };

  const getStatusColor = (submissionRate: number) => {
    if (submissionRate >= 80) return colors.success;
    if (submissionRate >= 50) return colors.warning;
    return colors.error;
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
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

  // RTL-aware styles
  const rtlStyles = {
    headerContent: {
      flexDirection: isRTL ? 'row-reverse' : 'row' as any,
    },
    newButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row' as any,
    },
    statsGrid: {
      flexDirection: isRTL ? 'row-reverse' : 'row' as any,
    },
    cardHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row' as any,
    },
    cardTextContainer: {
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    tagContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row' as any,
    },
    progressHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row' as any,
    },
    cardFooter: {
      flexDirection: isRTL ? 'row-reverse' : 'row' as any,
    },
    footerInfo: {
      flexDirection: isRTL ? 'row-reverse' : 'row' as any,
    },
    footerItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row' as any,
    },
    viewText: {
      transform: isRTL ? [{ scaleX: -1 }] : [] as any,
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
            {t('homework.title')}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { fontFamily, color: colors.textSecondary }]}>
            {t("common.loading")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { fontFamily, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={[styles.headerContent, rtlStyles.headerContent]}>
          <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
            {t('homework.title')}
          </Text>
          <TouchableOpacity
            style={[styles.newButton, rtlStyles.newButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateHomework}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.newButtonText}>{t('common.new')}</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Overview */}
        <View style={[styles.statsOverview, { backgroundColor: colors.backgroundElevated }]}>
          <Text style={[styles.statsTitle, { fontFamily, color: colors.textPrimary }]}>
            {t("dashboard.overview")}
          </Text>
          <View style={[styles.statsGrid, rtlStyles.statsGrid]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                {homework.length}
              </Text>
              <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>
                {t('homework.stats.total')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                {homework.reduce((acc, hw) => acc + (hw.submissions_count || 0), 0)}
              </Text>
              <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>
                {t("submissions.title")}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                {homework.reduce((acc, hw) => acc + (hw.graded_count || 0), 0)}
              </Text>
              <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>
                {t("submissions.graded")}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontFamily, color: colors.success }]}>
                {homework.length > 0 ?
                  Math.round(homework.reduce((acc, hw) => acc + (hw.average_score || 0), 0) / homework.length) :
                  0}%
              </Text>
              <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>
                {t("dashboard.avgScore")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            enabled={isOnline}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {homework.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundElevated }]}>
            <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyStateTitle, { fontFamily, color: colors.textPrimary }]}>
              {t('homework.emptyState.title')}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { fontFamily, color: colors.textSecondary }]}>
              {t('homework.emptyState.subtitle')}
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateHomework}
            >
              <Text style={styles.createButtonText}>{t('homework.createButton')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.homeworkList}>
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
                      ...styles.cardShadow
                    }
                  ]}
                  onPress={() => handleHomeworkPress(item)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.cardHeader, rtlStyles.cardHeader]}>
                    <View style={[styles.cardTextContainer, rtlStyles.cardTextContainer]}>
                      <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                        {item.title}
                      </Text>
                      <Text
                        style={[styles.cardDescription, { fontFamily, color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                      <View style={[styles.tagContainer, rtlStyles.tagContainer]}>
                        <View style={[styles.tag, { backgroundColor: `${colors.primary}15` }]}>
                          <Text style={[styles.tagText, { fontFamily, color: colors.primary }]}>
                            {item.subject}
                          </Text>
                        </View>
                        <View style={[styles.tag, { backgroundColor: `${colors.accentSecondary}15` }]}>
                          <Text style={[styles.tagText, { fontFamily, color: colors.accentSecondary }]}>
                            {item.class}
                          </Text>
                        </View>
                        <View style={[styles.tag, { backgroundColor: `${colors.textTertiary}15` }]}>
                          <Text style={[styles.tagText, { fontFamily, color: colors.textSecondary }]}>
                            {item.points} {t('homework.points')}
                          </Text>
                        </View>
                        {isOverdue && (
                          <View style={[styles.tag, { backgroundColor: `${colors.error}15` }]}>
                            <Text style={[styles.tagText, { fontFamily, color: colors.error }]}>
                              {t('homework.overdue')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons
                      name={isRTL ? "chevron-back" : "chevron-forward"}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </View>

                  {/* Progress Bars */}
                  <View style={styles.progressContainer}>
                    {/* Submission Progress */}
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressHeader, rtlStyles.progressHeader]}>
                        <Text style={[styles.progressTitle, { fontFamily, color: colors.textPrimary }]}>
                          {t("submissions.title")}
                        </Text>
                        <Text style={[styles.progressSubtitle, { fontFamily, color: colors.textSecondary }]}>
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
                      <View style={[styles.progressHeader, rtlStyles.progressHeader]}>
                        <Text style={[styles.progressTitle, { fontFamily, color: colors.textPrimary }]}>
                          {t('homework.gradingProgress')}
                        </Text>
                        <Text style={[styles.progressSubtitle, { fontFamily, color: colors.textSecondary }]}>
                          {stats.graded}/{stats.submitted} {t('homework.graded')}
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
                  <View style={[styles.cardFooter, rtlStyles.cardFooter]}>
                    <View style={[styles.footerInfo, rtlStyles.footerInfo]}>
                      <View style={[styles.footerItem, rtlStyles.footerItem]}>
                        <Ionicons name="calendar" size={16} color={colors.textSecondary} />
                        <Text style={[styles.footerText, { fontFamily, color: colors.textSecondary }]}>
                          {t('homework.due')}: {formatDueDate(item.due_date)}
                        </Text>
                      </View>
                      {stats.averageScore > 0 && (
                        <View style={[styles.footerItem, rtlStyles.footerItem]}>
                          <Ionicons name="trophy" size={16} color={colors.warning} />
                          <Text style={[styles.footerText, { fontFamily, color: colors.warning }]}>
                            {t('homework.average')}: {stats.averageScore}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.viewText, rtlStyles.viewText, { fontFamily, color: colors.primary }]}>
                      {isRTL ? '← View' : 'View →'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    paddingBottom: 40
  } as any,
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  } as any,
  headerContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  } as any,
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  } as any,
  newButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as any,
  newButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
    marginHorizontal: 6,
  } as any,
  statsOverview: {
    borderRadius: 16,
    padding: 16,
    ...designTokens.shadows.sm,
  } as any,
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.2,
  } as any,
  statsGrid: {
    justifyContent: 'space-between',
  } as any,
  statItem: {
    alignItems: 'center',
    flex: 1,
  } as any,
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  } as any,
  statLabel: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.7,
  } as any,
  scrollView: {
    flex: 1,
  } as any,
  contentContainer: {
    paddingBottom: 40,
  } as any,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  } as any,
  loadingText: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '500',
  } as any,
  emptyState: {
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 60,
    paddingHorizontal: 30,
    marginHorizontal: 20,
    marginTop: 20,
    ...designTokens.shadows.sm,
  } as any,
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  } as any,
  emptyStateSubtitle: {
    fontSize: 17,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
    marginBottom: 24,
  } as any,
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as any,
  createButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  } as any,
  homeworkList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  } as any,
  homeworkCard: {
    borderRadius: 16,
    padding: 20,
    ...designTokens.shadows.sm,
  } as any,
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  } as any,
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  } as any,
  cardTextContainer: {
    flex: 1,
  } as any,
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  } as any,
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.8,
  } as any,
  tagContainer: {
    flexWrap: 'wrap' as 'wrap',
    gap: 8,
  } as any,
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  } as any,
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  } as any,
  progressContainer: {
    marginBottom: 20,
    gap: 16,
  } as any,
  progressBarContainer: {
    gap: 6,
  } as any,
  progressHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  } as any,
  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
  } as any,
  progressSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.7,
  } as any,
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  } as any,
  progressFill: {
    height: '100%',
    borderRadius: 3,
  } as any,
  cardFooter: {
    justifyContent: 'space-between',
    alignItems: 'center',
  } as any,
  footerInfo: {
    gap: 16,
  } as any,
  footerItem: {
    alignItems: 'center',
  } as any,
  footerText: {
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: 6,
    opacity: 0.8,
  } as any,
  viewText: {
    fontSize: 17,
    fontWeight: '600',
  } as any,
  bottomSpacing: {
    height: 20,
  } as any,
};