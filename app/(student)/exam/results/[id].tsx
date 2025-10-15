// app/exam/results/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Alert from "@blazejkustra/react-native-alert";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '../../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../../../src/contexts/ThemeContext';
import { designTokens } from '../../../../src/utils/designTokens';
import Animated, { FadeIn } from 'react-native-reanimated';

interface ResultData {
  submission: {
    id: string;
    score: number;
    total_points: number;
    submitted_at: string;
    needs_manual_grading?: boolean;
    is_manually_graded?: boolean;
    answers: Array<{
      question_id: string;
      answer: string;
      is_correct: boolean;
      points: number;
    }>;
  };
  exam: {
    id: string;
    title: string;
    subject: string;
    class: string;
    teacher: {
      profile: {
        name: string;
      };
    };
    questions: Array<{
      id: string;
      question: string;
      type: 'mcq' | 'text';
      options: string[];
      correct_answer: string;
      points: number;
    }>;
  };
}

export default function ExamResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const submissionId = Array.isArray(params.submissionId) ? params.submissionId[0] : params.submissionId;
  const examId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { colors, isDark } = useThemeContext();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  useEffect(() => {
    if (submissionId) {
      loadResults();
    } else if (examId) {
      loadLatestSubmission();
    } else {
      setLoading(false);
    }
  }, [submissionId, examId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSubmissionResults(submissionId!);

      if (response.data.success) {
        setResultData(response.data.data);
      } else {
        Alert.alert('Error', 'Failed to load results');
      }
    } catch (error: any) {
      console.error('Failed to load results:', error);
      Alert.alert('Error', 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const loadLatestSubmission = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLatestSubmission(examId!);

      if (response.data.success && response.data.data) {
        setResultData(response.data.data);
      } else {
        setResultData({
          submission: {
            id: 'temp',
            score: Number(params.score) || 0,
            total_points: Number(params.totalPoints) || 100,
            submitted_at: new Date().toISOString(),
            answers: []
          },
          exam: {
            id: examId!,
            title: String(params.examTitle) || 'Exam Results',
            subject: 'Unknown',
            class: 'Unknown',
            teacher: { profile: { name: 'Teacher' } },
            questions: []
          }
        });
      }
    } catch (error) {
      console.error('Failed to load submission:', error);
      setResultData({
        submission: {
          id: 'temp',
          score: Number(params.score) || 0,
          total_points: Number(params.totalPoints) || 100,
          submitted_at: new Date().toISOString(),
          answers: []
        },
        exam: {
          id: examId!,
          title: String(params.examTitle) || 'Exam Results',
          subject: 'Unknown',
          class: 'Unknown',
          teacher: { profile: { name: 'Teacher' } },
          questions: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return isDark ? '#30D158' : '#34C759';
    if (percentage >= 80) return isDark ? '#FFD60A' : '#FFCC00';
    if (percentage >= 70) return isDark ? '#FF9F0A' : '#FF9500';
    return isDark ? '#FF453A' : '#FF3B30';
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 80) return 'Good Job!';
    if (percentage >= 70) return 'Not Bad!';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading Results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!resultData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={isDark ? '#FF453A' : '#FF3B30'} />
          <Text style={[styles.errorText, { color: isDark ? '#FF453A' : '#FF3B30' }]}>
            Results Not Available
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            Unable to load exam results. Please try again later.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/exams')}
          >
            <Text style={styles.buttonText}>Back to Exams</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const percentage = Math.round((resultData.submission.score / resultData.submission.total_points) * 100);
  const correctAnswers = resultData.submission.answers.filter(a => a.is_correct).length;
  const totalQuestions = resultData.submission.answers.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.backgroundElevated,
        borderBottomColor: colors.border
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Exam Results
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <Animated.ScrollView
        entering={FadeIn.duration(600)}
        style={styles.content}>

        {resultData.submission.needs_manual_grading && !resultData.submission.is_manually_graded ? (
          <View style={[styles.pendingGrading, { backgroundColor: colors.backgroundElevated }]}>
            <Ionicons name="time" size={32} color={colors.textTertiary} />
            <Text style={[styles.pendingText, { color: colors.textPrimary }]}>
              Awaiting Manual Grading
            </Text>
            <Text style={[styles.pendingSubtext, { color: colors.textSecondary }]}>
              Your teacher will grade this submission manually
            </Text>
          </View>
        ) : (
        <View style={[styles.scoreCard, {
          backgroundColor: colors.backgroundElevated,
          ...designTokens.shadows.md
        }]}>
          <Text style={[styles.examTitle, { color: colors.textPrimary }]}>
            {resultData.exam.title}
          </Text>
          <Text style={[styles.examInfo, { color: colors.textSecondary }]}>
            {resultData.exam.subject} • {resultData.exam.class}
          </Text>

          <View style={[styles.scoreCircle, {
            backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8',
            borderColor: colors.primary
          }]}>
            <Text style={[styles.scorePercentage, { color: colors.primary }]}>
              {percentage}%
            </Text>
            <Text style={[styles.scoreText, { color: colors.textSecondary }]}>
              {resultData.submission.score}/{resultData.submission.total_points}
            </Text>
          </View>

          <Text style={[
            styles.gradeText,
            { color: getGradeColor(percentage) }
          ]}>
            {getGradeText(percentage)}
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
                {correctAnswers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Correct
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
                {totalQuestions - correctAnswers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Incorrect
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
                {totalQuestions}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Total
              </Text>
            </View>
          </View>
        </View>
        )}

        {resultData.submission.answers.length > 0 && (
          <View style={[styles.answersSection, {
            backgroundColor: colors.backgroundElevated
          }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Answer Review
              </Text>
              <TouchableOpacity
                style={[styles.toggleButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAllAnswers(!showAllAnswers)}
              >
                <Text style={styles.toggleButtonText}>
                  {showAllAnswers ? 'Show Summary' : 'Show All Answers'}
                </Text>
              </TouchableOpacity>
            </View>

            {showAllAnswers ? (
              <View style={styles.answersList}>
                {resultData.submission.answers.map((answer, index) => {
                  const question = resultData.exam.questions.find(q => q.id === answer.question_id);
                  return (
                    <View key={answer.question_id} style={[styles.answerItem, {
                      backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8'
                    }]}>
                      <View style={styles.questionHeader}>
                        <Text style={[styles.questionNumber, { color: colors.textPrimary }]}>
                          Q{index + 1}
                        </Text>
                        <View style={[
                          styles.correctBadge,
                          answer.is_correct ? styles.correct : styles.incorrect,
                          {
                            backgroundColor: answer.is_correct
                              ? (isDark ? '#30D15820' : '#34C75920')
                              : (isDark ? '#FF453A20' : '#FF3B3020')
                          }
                        ]}>
                          <Text style={[
                            styles.correctBadgeText,
                            {
                              color: answer.is_correct
                                ? (isDark ? '#30D158' : '#34C759')
                                : (isDark ? '#FF453A' : '#FF3B30')
                            }
                          ]}>
                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                          </Text>
                        </View>
                        <Text style={[styles.pointsText, { color: colors.textTertiary }]}>
                          {answer.points} pts
                        </Text>
                      </View>

                      {question && (
                        <>
                          <Text style={[styles.questionText, { color: colors.textPrimary }]}>
                            {question.question}
                          </Text>

                          {question.type === 'mcq' && (
                            <View style={styles.optionsReview}>
                              <Text style={[styles.answerLabel, { color: colors.textSecondary }]}>
                                Your answer:
                              </Text>
                              <Text style={[
                                styles.answerText,
                                answer.is_correct
                                  ? (isDark ? styles.correctTextDark : styles.correctText)
                                  : (isDark ? styles.incorrectTextDark : styles.incorrectText),
                                { color: colors.textPrimary }
                              ]}>
                                {answer.answer}
                              </Text>

                              {!answer.is_correct && (
                                <>
                                  <Text style={[styles.answerLabel, { color: colors.textSecondary }]}>
                                    Correct answer:
                                  </Text>
                                  <Text style={[
                                    styles.correctAnswerText,
                                    {
                                      backgroundColor: isDark ? '#30D15820' : '#34C75920',
                                      color: colors.textPrimary
                                    }
                                  ]}>
                                    {question.correct_answer}
                                  </Text>
                                </>
                              )}
                            </View>
                          )}

                          {question.type === 'text' && (
                            <View style={styles.textAnswerReview}>
                              <Text style={[styles.answerLabel, { color: colors.textSecondary }]}>
                                Your answer:
                              </Text>
                              <Text style={[
                                styles.textAnswer,
                                {
                                  backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8',
                                  color: colors.textPrimary,
                                  borderColor: colors.border
                                }
                              ]}>
                                {answer.answer}
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.summaryView}>
                <View style={styles.correctAnswers}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={isDark ? '#30D158' : '#34C759'}
                  />
                  <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
                    {correctAnswers} questions correct
                  </Text>
                </View>
                <View style={styles.incorrectAnswers}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={isDark ? '#FF453A' : '#FF3B30'}
                  />
                  <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
                    {totalQuestions - correctAnswers} questions incorrect
                  </Text>
                </View>
                <Text style={[styles.summaryHint, { color: colors.textTertiary }]}>
                  Tap "Show All Answers" to review each question in detail
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/exams')}
          >
            <Ionicons name="list" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Back to Exams</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, {
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.primary
            }]}
            onPress={() => router.push('/')}
          >
            <Ionicons name="home" size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              Go to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  pendingGrading: {
    margin: 16,
    padding: 24,
    borderRadius: designTokens.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  pendingSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scoreCard: {
    margin: 16,
    padding: 24,
    borderRadius: designTokens.borderRadius.xl,
    alignItems: 'center',
  },
  examTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  examInfo: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    marginBottom: 16,
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 16,
    marginTop: 4,
  },
  gradeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  answersSection: {
    margin: 16,
    padding: 20,
    borderRadius: designTokens.borderRadius.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: designTokens.spacing.md,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  answersList: {
  },
  answerItem: {
    padding: 16,
    borderRadius: designTokens.borderRadius.lg,
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  correctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  correct: {
  },
  incorrect: {
  },
  correctBadgeText: {
    fontSize: 12,
    fontWeight: '600', 
  },
  pointsText: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  questionText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  optionsReview: {
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 16,
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
  },
  correctText: {
    backgroundColor: '#34C75920',
  },
  incorrectText: {
    backgroundColor: '#FF3B3020',
  },
  correctTextDark: {
    backgroundColor: '#30D15820',
  },
  incorrectTextDark: {
    backgroundColor: '#FF453A20',
  },
  correctAnswerText: {
    fontSize: 16,
    padding: 8,
    borderRadius: 4,
  },
  textAnswerReview: {
  },
  textAnswer: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  summaryView: {
  },
  correctAnswers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  incorrectAnswers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    marginLeft: 8,
  },
  summaryHint: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionButtons: {
    padding: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: designTokens.borderRadius.lg,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  button: {
    padding: 16,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
