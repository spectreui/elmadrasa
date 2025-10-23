// app/(student)/exams.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Exam } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { designTokens } from '../../src/utils/designTokens';
import Animated, { FadeIn, FadeInUp, Layout } from 'react-native-reanimated';
import Alert from '@/components/Alert';
import { useTranslation } from '@/hooks/useTranslation';

export default function ExamsScreen() {
  const { t, isRTL } = useTranslation();
  const { user, isOnline } = useAuth();
  const { fontFamily, colors } = useThemeContext();
  const [exams, setExams] = useState<Exam[]>([]);
  const [takenExams, setTakenExams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    completed: 0,
    available: 0,
    upcoming: 0,
    missed: 0
  });

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);

      // Load exams data
      const examsResponse = await apiService.getExams();

      if (examsResponse.data.success) {
        const allExams = examsResponse.data.data || [];
        setExams(allExams);

        // Check which exams have been taken
        const takenStatuses = await Promise.all(
          allExams.map(async (exam: any) => {
            try {
              const status = await apiService.checkExamTaken(exam.id);
              return { examId: exam.id, taken: status };
            } catch (error) {
              return { examId: exam.id, taken: false };
            }
          })
        );

        const takenSet = new Set<string>();
        takenStatuses.forEach(({ examId, taken }) => {
          if (taken) {
            takenSet.add(examId);
          }
        });
        setTakenExams(takenSet);

        // Calculate stats
        let completed = 0;
        let available = 0;
        let upcoming = 0;
        let missed = 0;

        allExams.forEach((exam: any) => {
          if (takenSet.has(exam.id)) {
            completed++;
          } else {
            const status = getExamStatus(exam);
            switch (status) {
              case 'available':
                available++;
                break;
              case 'upcoming':
                upcoming++;
                break;
              case 'missed':
                missed++;
                break;
            }
          }
        });

        setStats({
          completed,
          available,
          upcoming,
          missed
        });
      } else {
        Alert.alert(t('common.error'), t('exams.loadFailed'));
      }

    } catch (error) {
      Alert.alert(t('common.error'), t('exams.loadFailed'));
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
  }, [t]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const onRefresh = () => {
    setRefreshing(true);
    loadExams();
  };

  // Update the getExamStatus function to handle the new status field
  const getExamStatus = (exam: Exam): 'available' | 'taken' | 'upcoming' | 'missed' => {
    // Use the status from backend if available, otherwise calculate it
    if (exam.status) {
      return exam.status as 'available' | 'taken' | 'upcoming' | 'missed';
    }

    // Fallback to calculation if needed
    if (takenExams.has(exam.id)) {
      return 'taken';
    }

    const now = new Date();
    const availableFrom = exam.available_from ? new Date(exam.available_from) : null;
    const dueDate = exam.due_date ? new Date(exam.due_date) : null;

    // If available_from is in the future, it's upcoming
    if (availableFrom && now < availableFrom) {
      return 'upcoming';
    }

    // If due_date is in the past, it's missed
    if (dueDate && now > dueDate) {
      return 'missed';
    }

    // If within the window, it's available
    const isAfterStart = availableFrom ? now >= availableFrom : true;
    const isBeforeEnd = dueDate ? now <= dueDate : true;

    if (isAfterStart && isBeforeEnd) {
      return 'available';
    }

    return 'available'; // fallback
  };

  // Update getStatusColor to include missed status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return { bg: '#10B98115', border: '#10B981', text: '#10B981' };
      case 'taken': return { bg: '#3B82F615', border: '#3B82F6', text: '#3B82F6' };
      case 'upcoming': return { bg: '#F59E0B15', border: '#F59E0B', text: '#F59E0B' };
      case 'missed': return { bg: '#EF444415', border: '#EF4444', text: '#EF4444' };
      default: return { bg: '#6B728015', border: '#6B7280', text: '#6B7280' };
    }
  };

  // Update getStatusText to include missed status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return t('exams.available');
      case 'taken': return t('exams.taken');
      case 'upcoming': return t('exams.upcoming');
      case 'missed': return t('exams.missed');
      default: return t('common.unknown');
    }
  };

  // Update handleExamPress to handle missed exams
  const handleExamPress = async (exam: Exam) => {
    const status = getExamStatus(exam);

    if (status === 'taken') {
      try {
        // Fetch the latest submission for this exam
        const response = await apiService.getLatestSubmission(exam.id);
        if (response.data.success && response.data.data) {
          const submissionId = response.data.data.submission.id;
          router.push(`/exam/results/${exam.id}?submissionId=${submissionId}`);
        } else {
          // Fallback if no submission found
          router.push(`/exam/results/${exam.id}`);
        }
      } catch (error) {
        // Fallback if API call fails
        router.push(`/exam/results/${exam.id}`);
      }
    } else if (status === 'available') {
      // For available exams, check access before navigating
      router.push(`/exam/${exam.id}`);
    } else if (status === 'upcoming') {
      const availableFrom = exam.available_from ? new Date(exam.available_from) : null;
      if (availableFrom) {
        Alert.alert(t('exams.upcoming'), `${t('exams.availableOn')} ${availableFrom.toLocaleString()}.`);
      }
    } else if (status === 'missed') {
      Alert.alert(t('exams.expired'), t('exams.dueDatePassed'));
    }
  };

  // Add this helper function outside your component
  const mapClassDisplay = (className: string): string => {
    const classMap: { [key: string]: string } = {
      '7': t('classes.prep1'), '8': t('classes.prep2'), '9': t('classes.prep3'),
      '10': t('classes.sec1'), '11': t('classes.sec2'), '12': t('classes.sec3')
    };

    // Handle common Egyptian class formats
    const normalized = className.toLowerCase().trim();
    if (normalized.includes('prep') || normalized.includes('preparatory')) {
      if (normalized.includes('1') || normalized.includes('first')) return t('classes.prep1');
      if (normalized.includes('2') || normalized.includes('second')) return t('classes.prep2');
      if (normalized.includes('3') || normalized.includes('third')) return t('classes.prep3');
    }
    if (normalized.includes('secondary')) {
      if (normalized.includes('1') || normalized.includes('first')) return t('classes.sec1');
      if (normalized.includes('2') || normalized.includes('second')) return t('classes.sec2');
      if (normalized.includes('3') || normalized.includes('third')) return t('classes.sec3');
    }

    return classMap[className] || `${t('classes.class')} ${className}`;
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontFamily, color: colors.textSecondary }]}>
          {t('exams.loading')}
        </Text>
      </View>
    );
  }

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      entering={FadeIn.duration(600)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          style={{ backgroundColor: 'transparent' }}
          enabled={isOnline}
        />
      }
    >
      <View style={styles.content}>
        <Text style={[styles.title, { fontFamily, color: colors.textPrimary }]}>
          {t('exams.title2')}
        </Text>
        <Text style={[styles.subtitle, { fontFamily, color: colors.textSecondary }]}>
          {t('exams.takeTrack')}
        </Text>

        {/* Stats Cards */}
        <View style={[styles.statsContainer, isRTL && styles.rtlRow]}>
          <View style={[styles.statCard, { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.md }]}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F615' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
              {stats.completed}
            </Text>
            <Text style={[styles.statLabel, { fontFamily, color: colors.textTertiary }]}>
              {t('exams.completed')}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.md }]}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="document-text" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
              {stats.available}
            </Text>
            <Text style={[styles.statLabel, { fontFamily, color: colors.textTertiary }]}>
              {t('exams.available')}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.md }]}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B15' }]}>
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
              {stats.upcoming}
            </Text>
            <Text style={[styles.statLabel, { fontFamily, color: colors.textTertiary }]}>
              {t('exams.upcoming')}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.md }]}>
            <View style={[styles.statIcon, { backgroundColor: '#EF444415' }]}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
              {stats.missed}
            </Text>
            <Text style={[styles.statLabel, { fontFamily, color: colors.textTertiary }]}>
              {t('exams.missed')}
            </Text>
          </View>
        </View>

        {exams.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.sm }]}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { fontFamily, color: colors.textSecondary }]}>
              {t('exams.noExams')}
            </Text>
            <Text style={[styles.emptyText, { fontFamily, color: colors.textTertiary }]}>
              {user?.profile?.class
                ? `${t('exams.noExamsForClass')} ${user.profile.class}. ${t('exams.checkBack')}`
                : t('exams.checkClassAssignment')
              }
            </Text>
          </View>
        ) : (
          <View>
            {exams.map((exam, index) => {
              const status = getExamStatus(exam);
              const statusColors = getStatusColor(status);

              return (
                <Animated.View
                  key={exam.id}
                  entering={FadeInUp.delay(index * 100)}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity
                    onPress={() => handleExamPress(exam)}
                    disabled={status === 'upcoming' || status === 'missed'}
                    style={[
                      styles.examCard,
                      {
                        backgroundColor: colors.backgroundElevated,
                        ...designTokens.shadows.sm,
                        borderLeftWidth: 4,
                        borderLeftColor: statusColors.border,
                        opacity: (status === 'upcoming' || status === 'missed') ? 0.7 : 1
                      },
                      isRTL && styles.rtlCard
                    ]}
                  >
                    <View style={[styles.cardHeader, isRTL && styles.rtlRow]}>
                      <View style={styles.cardTitleContainer}>
                        <Text style={[styles.examTitle, { fontFamily, color: colors.textPrimary }]} numberOfLines={1}>
                          {exam.title}
                        </Text>
                        <Text style={[styles.examDetails, { fontFamily, color: colors.textSecondary }]}>
                          {exam.subject} • {mapClassDisplay(exam.class)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { fontFamily, color: statusColors.text }]}>
                          {getStatusText(status)}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.cardInfo, isRTL && styles.rtlRow]}>
                      <View style={[styles.infoItem, isRTL && styles.rtlRow]}>
                        <Ionicons name="person" size={16} color={colors.textTertiary} />
                        <Text style={[styles.infoText, { fontFamily, color: colors.textSecondary, ...(isRTL ? { marginRight: designTokens.spacing.xs } : { marginLeft: designTokens.spacing.xs }) }]} numberOfLines={1}>
                          {exam.teacher?.profile?.name || t('common.teacher')}
                        </Text>
                      </View>
                      <View style={[styles.infoItem, isRTL && styles.rtlRow]}>
                        <Ionicons name="time" size={16} color={colors.textTertiary} />
                        <Text style={[styles.infoText, { fontFamily, color: colors.textSecondary, ...(isRTL ? { marginRight: designTokens.spacing.xs } : { marginLeft: designTokens.spacing.xs }) }]}>
                          {exam.settings?.timed ? `${exam.settings.duration}${t('exams.minutes')}` : t('exams.untimed')}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.cardFooter, isRTL && styles.rtlRow]}>
                      <View style={styles.dateContainer}>
                        {exam.available_from && (
                          <Text style={[styles.dateText, { fontFamily, color: colors.textTertiary }]}>
                            {t('exams.available')}: {new Date(exam.available_from).toLocaleDateString()} {t('exams.at')} {new Date(exam.available_from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                        {exam.due_date && (
                          <Text style={[styles.dateText, { fontFamily, color: colors.textTertiary }]}>
                            {t('exams.due')}: {new Date(exam.due_date).toLocaleDateString()} {t('exams.at')} {new Date(exam.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                        {!exam.available_from && !exam.due_date && (
                          <Text style={[styles.dateText, { fontFamily, color: colors.textTertiary }]}>
                            {t('exams.noTimeRestrictions')}
                          </Text>
                        )}
                      </View>

                      <View style={[styles.actionContainer, isRTL && styles.rtlRow]}>
                        <Text style={[styles.actionText, {
                          fontFamily,
                          color: (status === 'upcoming' || status === 'missed')
                            ? colors.textTertiary
                            : colors.primary
                        }]}>
                          {status === 'taken'
                            ? t('exams.viewResults')
                            : (status === 'upcoming' || status === 'missed')
                              ? t('exams.notAvailable')
                              : t('exams.startExam')}
                        </Text>
                        {(status !== 'upcoming' && status !== 'missed') && (
                          <Ionicons
                            name={isRTL ? "chevron-back" : "chevron-forward"}
                            size={16}
                            color={getStatusColor(status).text}
                          />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>
    </Animated.ScrollView>
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
  },
  content: {
    padding: designTokens.spacing.xl,
    paddingBottom: 70,
  },
  title: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight,
    marginBottom: designTokens.spacing.xs,
  },
  subtitle: {
    fontSize: designTokens.typography.body.fontSize,
    marginBottom: designTokens.spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: -designTokens.spacing.xs,
    marginBottom: designTokens.spacing.xl,
  },
  statCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    flex: 1,
    marginHorizontal: designTokens.spacing.xs,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: designTokens.typography.footnote.fontSize,
  },
  emptyContainer: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.xl,
    alignItems: 'center',
    ...designTokens.shadows.sm,
  },
  emptyTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.xs,
  },
  emptyText: {
    fontSize: designTokens.typography.footnote.fontSize,
    textAlign: 'center',
  },
  examCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.md,
  },
  cardTitleContainer: {
    flex: 1,
  },
  examTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: designTokens.typography.headline.fontWeight,
    marginBottom: designTokens.spacing.xs,
  },
  examDetails: {
    fontSize: designTokens.typography.footnote.fontSize,
  },
  statusBadge: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
  },
  statusText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600',
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: designTokens.typography.footnote.fontSize,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600',
    marginRight: designTokens.spacing.xs,
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlCard: {
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
});
