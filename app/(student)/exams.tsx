// app/(student)/exams.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Exam } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { designTokens } from '../../src/utils/designTokens';
import Animated, { FadeIn, FadeInUp, Layout } from 'react-native-reanimated';

export default function ExamsScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useThemeContext();
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
          allExams.map(async (exam) => {
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

        allExams.forEach(exam => {
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
        Alert.alert('Error', 'Failed to load exams data');
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const onRefresh = () => {
    setRefreshing(true);
    loadExams();
  };

  const getExamStatus = (exam: Exam): 'available' | 'taken' | 'upcoming' | 'missed' => {
    if (takenExams.has(exam.id)) {
      return 'taken';
    }

    // If no due date, consider it available
    if (!exam.due_date) {
      return 'available';
    }

    // Properly parse the date with timezone
    const now = new Date();
    const dueDate = new Date(exam.due_date);

    // If due date is in the future, it's upcoming
    if (dueDate > now) {
      return 'upcoming';
    }

    // If due date has passed and not taken, it's missed
    return 'missed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return { bg: '#10B98115', border: '#10B981', text: '#10B981' };
      case 'taken': return { bg: '#3B82F615', border: '#3B82F6', text: '#3B82F6' };
      case 'upcoming': return { bg: '#F59E0B15', border: '#F59E0B', text: '#F59E0B' };
      case 'missed': return { bg: '#EF444415', border: '#EF4444', text: '#EF4444' };
      default: return { bg: '#6B728015', border: '#6B7280', text: '#6B7280' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'taken': return 'Completed';
      case 'upcoming': return 'Upcoming';
      case 'missed': return 'Missed';
      default: return 'Unknown';
    }
  };

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
      router.push(`/exam/${exam.id}`);
    }
  };


  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          color: colors.textSecondary,
          marginTop: designTokens.spacing.md,
          fontSize: designTokens.typography.body.fontSize
        }}>
          Loading exams...
        </Text>
      </View>
    );
  }

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
          style={{ backgroundColor: 'transparent' }}
        />
      }
    >
      <View style={{ padding: designTokens.spacing.xl }}>
        <Text style={{
          fontSize: designTokens.typography.title1.fontSize,
          fontWeight: designTokens.typography.title1.fontWeight,
          color: colors.textPrimary,
          marginBottom: designTokens.spacing.xs
        } as any}>
          Exams
        </Text>
        <Text style={{
          color: colors.textSecondary,
          marginBottom: designTokens.spacing.xl,
          fontSize: designTokens.typography.body.fontSize
        }}>
          Take your exams and track your progress
        </Text>

        {/* Stats Cards */}
        <View style={{
          flexDirection: 'row',
          marginHorizontal: -designTokens.spacing.xs,
          marginBottom: designTokens.spacing.xl
        }}>
          <View style={{
            backgroundColor: colors.backgroundElevated,
            borderRadius: designTokens.borderRadius.xl,
            padding: designTokens.spacing.lg,
            ...designTokens.shadows.md,
            flex: 1,
            marginHorizontal: designTokens.spacing.xs
          }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#3B82F615',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: designTokens.spacing.sm
            }}>
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
            </View>
            <Text style={{
              fontSize: designTokens.typography.title2.fontSize,
              fontWeight: designTokens.typography.title2.fontWeight,
              color: colors.textPrimary,
              marginBottom: 2
            } as any}>
              {stats.completed}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textTertiary
            }}>
              Completed
            </Text>
          </View>

          <View style={{
            backgroundColor: colors.backgroundElevated,
            borderRadius: designTokens.borderRadius.xl,
            padding: designTokens.spacing.lg,
            ...designTokens.shadows.md,
            flex: 1,
            marginHorizontal: designTokens.spacing.xs
          }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#10B98115',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: designTokens.spacing.sm
            }}>
              <Ionicons name="document-text" size={20} color="#10B981" />
            </View>
            <Text style={{
              fontSize: designTokens.typography.title2.fontSize,
              fontWeight: designTokens.typography.title2.fontWeight,
              color: colors.textPrimary,
              marginBottom: 2
            } as any}>
              {stats.available}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textTertiary
            }}>
              Available
            </Text>
          </View>

          <View style={{
            backgroundColor: colors.backgroundElevated,
            borderRadius: designTokens.borderRadius.xl,
            padding: designTokens.spacing.lg,
            ...designTokens.shadows.md,
            flex: 1,
            marginHorizontal: designTokens.spacing.xs
          }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#F59E0B15',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: designTokens.spacing.sm
            }}>
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <Text style={{
              fontSize: designTokens.typography.title2.fontSize,
              fontWeight: designTokens.typography.title2.fontWeight,
              color: colors.textPrimary,
              marginBottom: 2
            } as any}>
              {stats.upcoming}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textTertiary
            }}>
              Upcoming
            </Text>
          </View>

          <View style={{
            backgroundColor: colors.backgroundElevated,
            borderRadius: designTokens.borderRadius.xl,
            padding: designTokens.spacing.lg,
            ...designTokens.shadows.md,
            flex: 1,
            marginHorizontal: designTokens.spacing.xs
          }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#EF444415',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: designTokens.spacing.sm
            }}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
            </View>
            <Text style={{
              fontSize: designTokens.typography.title2.fontSize,
              fontWeight: designTokens.typography.title2.fontWeight,
              color: colors.textPrimary,
              marginBottom: 2
            } as any}>
              {stats.missed}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textTertiary
            }}>
              Missed
            </Text>
          </View>
        </View>

        {exams.length === 0 ? (
          <View style={{
            backgroundColor: colors.backgroundElevated,
            borderRadius: designTokens.borderRadius.xl,
            padding: designTokens.spacing.xl,
            alignItems: 'center',
            ...designTokens.shadows.sm
          }}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={{
              fontSize: designTokens.typography.headline.fontSize,
              color: colors.textSecondary,
              marginTop: designTokens.spacing.md,
              marginBottom: designTokens.spacing.xs
            }}>
              No exams available
            </Text>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textTertiary,
              textAlign: 'center'
            }}>
              {user?.profile?.class
                ? `No exams found for Class ${user.profile.class}. Check back later.`
                : 'Please check your class assignment.'
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
                  entering={FadeInUp.delay(index * 100)} // This makes cards fade in one by one
                  layout={Layout.springify()} // This animates when cards move/resize
                >
                  <TouchableOpacity
                    onPress={() => handleExamPress(exam)}
                    disabled={status === 'upcoming' || status === 'missed'}
                    style={{
                      backgroundColor: colors.backgroundElevated,
                      borderRadius: designTokens.borderRadius.xl,
                      padding: designTokens.spacing.lg,
                      ...designTokens.shadows.sm,
                      marginBottom: designTokens.spacing.sm,
                      borderLeftWidth: 4,
                      borderLeftColor: statusColors.border,
                      opacity: (status === 'upcoming' || status === 'missed') ? 0.7 : 1
                    }}
                  >
                    {/* Keep the rest of your card content exactly the same */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: designTokens.spacing.md }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: designTokens.typography.headline.fontSize,
                          fontWeight: designTokens.typography.headline.fontWeight,
                          color: colors.textPrimary,
                          marginBottom: designTokens.spacing.xs
                        } as any} numberOfLines={1}>
                          {exam.title}
                        </Text>
                        <Text style={{
                          fontSize: designTokens.typography.footnote.fontSize,
                          color: colors.textSecondary
                        }}>
                          {exam.subject} • Class {exam.class}
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: statusColors.bg,
                        paddingHorizontal: designTokens.spacing.md,
                        paddingVertical: designTokens.spacing.xs,
                        borderRadius: designTokens.borderRadius.full
                      }}>
                        <Text style={{
                          fontSize: designTokens.typography.caption2.fontSize,
                          color: statusColors.text,
                          fontWeight: '600'
                        }}>
                          {getStatusText(status)}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: designTokens.spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="person" size={16} color={colors.textTertiary} />
                        <Text style={{
                          fontSize: designTokens.typography.footnote.fontSize,
                          color: colors.textSecondary,
                          marginLeft: designTokens.spacing.xs
                        }} numberOfLines={1}>
                          {exam.teacher?.profile?.name || 'Teacher'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="time" size={16} color={colors.textTertiary} />
                        <Text style={{
                          fontSize: designTokens.typography.footnote.fontSize,
                          color: colors.textSecondary,
                          marginLeft: designTokens.spacing.xs
                        }}>
                          {exam.settings?.timed ? `${exam.settings.duration}m` : 'Untimed'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{
                        fontSize: designTokens.typography.caption1.fontSize,
                        color: colors.textTertiary
                      }}>
                        {exam.due_date
                          ? `Due: ${new Date(exam.due_date).toLocaleDateString()}`
                          : 'No due date'}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{
                          fontSize: designTokens.typography.footnote.fontSize,
                          color: (status === 'upcoming' || status === 'missed')
                            ? colors.textTertiary
                            : colors.primary,
                          fontWeight: '600',
                          marginRight: designTokens.spacing.xs
                        }}>
                          {status === 'taken'
                            ? 'View Results'
                            : (status === 'upcoming' || status === 'missed')
                              ? 'Not Available'
                              : 'Start Exam'}
                        </Text>
                        {(status !== 'upcoming' && status !== 'missed') && (
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={(status === 'upcoming' || status === 'missed') ? colors.textTertiary : colors.primary}
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
