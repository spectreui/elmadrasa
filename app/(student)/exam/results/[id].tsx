// app/(student)/exam/results/[id].tsx - Complete fix
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Alert from '@/components/Alert';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '../../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../../../src/contexts/ThemeContext';
import { designTokens } from '../../../../src/utils/designTokens';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ShareModal } from '@/components/ShareModal';
import { generateExamResultsLink } from '@/utils/linking';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';

interface ResultData {
  submission: {
    id: string;
    score: number;
    total_points: number;
    submitted_at: string;
    needs_manual_grading?: boolean;
    is_manually_graded?: boolean;
    feedback?: string;
    answers: {
      question_id: string;
      answer: string;
      is_correct: boolean;
      points: number;
      needs_grading?: boolean;
    }[];
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
    questions: {
      id: string;
      question: string;
      type: 'mcq' | 'text';
      options: string[];
      correct_answer: string;
      points: number;
      explanation?: string;
    }[];
  };
}

export default function ExamResultsScreen() {
  const { t, isRTL } = useTranslation();
  const { isOnline } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fontFamily, colors, isDark } = useThemeContext();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Add this function to handle sharing
  const handleShare = () => {
    setShowShareModal(true);
  };

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);

      // Get the submission ID from query parameters
      const submissionId = Array.isArray(params.submissionId)
        ? params.submissionId[0]
        : params.submissionId;

      console.log('Loading results for submission ID:', submissionId);

      if (submissionId) {
        // Call the correct API endpoint with submission ID
        const response = await apiService.getSubmissionResults(submissionId);

        if (response.data.success) {
          setResultData(response.data.data);
        } else {
          Alert.alert(t('common.error'), response.data.error || t('exams.resultsLoadFailed'));
        }
      } else {
        // If no submission ID, try to get latest submission for the exam
        const examId = Array.isArray(params.id) ? params.id[0] : params.id;
        if (examId) {
          const response = await apiService.getLatestSubmission(examId);
          if (response.data.success && response.data.data) {
            setResultData(response.data.data);
          } else {
            Alert.alert(t('common.error'), t('exams.noSubmissionFound'));
          }
        } else {
          Alert.alert(t('common.error'), t('exams.noIdProvided'));
        }
      }
    } catch (error: any) {
      console.error('Failed to load results:', error);
      Alert.alert(t('common.error'), error.message || t('exams.loadResultsFailed'));
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

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return isDark ? '#30D158' : '#34C759';
    if (percentage >= 80) return isDark ? '#FFD60A' : '#FFCC00';
    if (percentage >= 70) return isDark ? '#FF9F0A' : '#FF9500';
    return isDark ? '#FF453A' : '#FF3B30';
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 90) return t('exams.excellent');
    if (percentage >= 80) return t('exams.goodJob');
    if (percentage >= 70) return t('exams.notBad');
    return t('exams.needsImprovement');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily }]}>
            {t('exams.loadingResults')}
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
          <Text style={[styles.errorText, { color: isDark ? '#FF453A' : '#FF3B30', fontFamily }]}>
            {t('exams.resultsNotAvailable')}
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary, fontFamily }]}>
            {t('exams.unableToLoad')}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/exams')}
          >
            <Text style={[styles.buttonText, { fontFamily }]}>
              {t('exams.backToExams')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const percentage = resultData.submission.total_points > 0
    ? Math.round((resultData.submission.score / resultData.submission.total_points) * 100)
    : 0;
  const correctAnswers = resultData.submission.answers.filter(a => a.is_correct).length;
  const totalQuestions = resultData.submission.answers.length;
  const needsManualGrading = resultData.submission.needs_manual_grading;
  const isManuallyGraded = resultData.submission.is_manually_graded;

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
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily }]}>
          {t('exams.examResults')}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        entering={FadeIn.duration(600)}
        style={styles.content}>

        {/* Manual Grading Status */}
        {needsManualGrading && !isManuallyGraded ? (
          <View style={[styles.pendingGrading, { backgroundColor: colors.backgroundElevated }]}>
            <Ionicons name="time" size={32} color={colors.textTertiary} />
            <Text style={[styles.pendingText, { color: colors.textPrimary, fontFamily }]}>
              {t('exams.awaitingGrading')}
            </Text>
            <Text style={[styles.pendingSubtext, { color: colors.textSecondary, fontFamily }]}>
              {t('exams.teacherWillGrade')}
            </Text>
          </View>
        ) : (
          <View style={[styles.scoreCard, {
            backgroundColor: colors.backgroundElevated,
            ...designTokens.shadows.md
          }]}>
            <Text style={[styles.examTitle, { color: colors.textPrimary, fontFamily }]}>
              {resultData.exam.title}
            </Text>
            <Text style={[styles.examInfo, { color: colors.textSecondary, fontFamily }]}>
              {resultData.exam.subject} • {resultData.exam.class}
            </Text>

            <View style={[styles.scoreCircle, {
              backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8',
              borderColor: colors.primary
            }]}>
              <Text style={[styles.scorePercentage, { color: colors.primary, fontFamily }]}>
                {percentage}%
              </Text>
              <Text style={[styles.scoreText, { color: colors.textSecondary, fontFamily }]}>
                {resultData.submission.score}/{resultData.submission.total_points}
              </Text>
            </View>

            <Text style={[
              styles.gradeText,
              { color: getGradeColor(percentage), fontFamily }
            ]}>
              {getGradeText(percentage)}
            </Text>

            <View style={[styles.statsGrid, isRTL && styles.rtlRow]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.textPrimary, fontFamily }]}>
                  {correctAnswers}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily }]}>
                  {t('exams.correct')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.textPrimary, fontFamily }]}>
                  {totalQuestions - correctAnswers}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily }]}>
                  {t('exams.incorrect')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.textPrimary, fontFamily }]}>
                  {totalQuestions}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily }]}>
                  {t('exams.total')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Teacher Feedback */}
        {isManuallyGraded && resultData.submission.feedback && (
          <View style={[styles.feedbackCard, {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.primary
          }]}>
            <View style={[styles.feedbackHeader, isRTL && styles.rtlRow]}>
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
              <Text style={[styles.feedbackTitle, { color: colors.textPrimary, fontFamily }]}>
                {t('exams.teacherFeedback')}
              </Text>
            </View>
            <Text style={[styles.feedbackText, { color: colors.textPrimary, fontFamily }]}>
              {resultData.submission.feedback}
            </Text>
          </View>
        )}

        {isManuallyGraded && resultData.submission.answers.length > 0 && (
          <View style={[styles.answersSection, {
            backgroundColor: colors.backgroundElevated
          }]}>
            <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily }]}>
                {t('exams.answerReview')}
              </Text>
              <TouchableOpacity
                style={[styles.toggleButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAllAnswers(!showAllAnswers)}
              >
                <Text style={[styles.toggleButtonText, { fontFamily }]}>
                  {showAllAnswers ? t('exams.showSummary') : t('exams.showAllAnswers')}
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
                      <View style={[styles.questionHeader, isRTL && styles.rtlRow]}>
                        <Text style={[styles.questionNumber, { color: colors.textPrimary, fontFamily }]}>
                          {t('exams.questionAbbr')}{index + 1}
                        </Text>

                        {answer.needs_grading ? (
                          <View style={[
                            styles.pendingBadge,
                            { backgroundColor: isDark ? '#FF9F0A20' : '#FF950020' }
                          ]}>
                            <Text style={[
                              styles.pendingBadgeText,
                              { color: isDark ? '#FF9F0A' : '#FF9500', fontFamily }
                            ]}>
                              {t('exams.pendingReview')}
                            </Text>
                          </View>
                        ) : (
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
                                  : (isDark ? '#FF453A' : '#FF3B30'),
                                fontFamily
                              }
                            ]}>
                              {answer.is_correct ? t('exams.correct') : t('exams.incorrect')}
                            </Text>
                          </View>
                        )}

                        <Text style={[styles.pointsText, { color: colors.textTertiary, fontFamily }]}>
                          {answer.points}/{question?.points || 0} {t('common.points')}
                        </Text>
                      </View>

                      {question && (
                        <>
                          <Text style={[styles.questionText, { color: colors.textPrimary, fontFamily }]}>
                            {question.question}
                          </Text>

                          {question.type === 'mcq' && (
                            <View style={styles.optionsReview}>
                              <Text style={[styles.answerLabel, { color: colors.textSecondary, fontFamily }]}>
                                {t('exams.yourAnswer')}:
                              </Text>
                              <Text style={[
                                styles.answerText,
                                answer.is_correct
                                  ? (isDark ? styles.correctTextDark : styles.correctText)
                                  : (isDark ? styles.incorrectTextDark : styles.incorrectText),
                                { color: colors.textPrimary, fontFamily }
                              ]}>
                                {answer.answer || t('exams.noAnswerProvided')}
                              </Text>

                              {!answer.is_correct && !answer.needs_grading && (
                                <>
                                  <Text style={[styles.answerLabel, { color: colors.textSecondary, fontFamily }]}>
                                    {t('exams.correctAnswer')}:
                                  </Text>
                                  <Text style={[
                                    styles.correctAnswerText,
                                    {
                                      backgroundColor: isDark ? '#30D15820' : '#34C75920',
                                      color: colors.textPrimary,
                                      fontFamily
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
                              <Text style={[styles.answerLabel, { color: colors.textSecondary, fontFamily }]}>
                                {t('exams.yourAnswer')}:
                              </Text>
                              <Text style={[
                                styles.textAnswer,
                                {
                                  backgroundColor: isDark ? '#1C1C1E' : '#F8F8F8',
                                  color: colors.textPrimary,
                                  borderColor: colors.border,
                                  fontFamily
                                }
                              ]}>
                                {answer.answer || t('exams.noAnswerProvided')}
                              </Text>

                              {answer.needs_grading && (
                                <View style={[styles.pendingNote, {
                                  backgroundColor: isDark ? '#FF9F0A20' : '#FF950020',
                                  borderColor: isDark ? '#FF9F0A' : '#FF9500'
                                }]}>
                                  <Ionicons name="time" size={16} color={isDark ? '#FF9F0A' : '#FF9500'} />
                                  <Text style={[styles.pendingNoteText, {
                                    color: isDark ? '#FF9F0A' : '#FF9500',
                                    fontFamily
                                  }]}>
                                    {t('exams.awaitingTeacherReview')}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}

                          {/* Show correct answer if available (for text questions or when manually graded) */}
                          {question.correct_answer && (isManuallyGraded || !answer.needs_grading) && (
                            <View style={[styles.correctAnswerSection, {
                              backgroundColor: isDark ? '#30D15820' : '#34C75920',
                              borderColor: isDark ? '#30D158' : '#34C759'
                            }]}>
                              <Text style={[styles.correctAnswerLabel, { color: colors.textPrimary, fontFamily }]}>
                                {t('exams.correctAnswer')}:
                              </Text>
                              <Text style={[styles.correctAnswerValue, { color: colors.textPrimary, fontFamily }]}>
                                {question.correct_answer}
                              </Text>
                            </View>
                          )}

                          {/* Show explanation if available */}
                          {question.explanation && (
                            <View style={[styles.explanationSection, {
                              backgroundColor: isDark ? '#0A84FF20' : '#007AFF20',
                              borderColor: isDark ? '#0A84FF' : '#007AFF'
                            }]}>
                              <View style={[styles.explanationHeader, isRTL && styles.rtlRow]}>
                                <Ionicons name="information-circle" size={16} color={isDark ? '#0A84FF' : '#007AFF'} />
                                <Text style={[styles.explanationTitle, { color: colors.textPrimary, fontFamily }]}>
                                  {t('exams.explanation')}
                                </Text>
                              </View>
                              <Text style={[styles.explanationText, { color: colors.textPrimary, fontFamily }]}>
                                {question.explanation}
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
                <View style={[styles.correctAnswers, isRTL && styles.rtlRow]}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={isDark ? '#30D158' : '#34C759'}
                  />
                  <Text style={[styles.summaryText, { color: colors.textPrimary, fontFamily }]}>
                    {correctAnswers} {t('exams.questionsCorrect')}
                  </Text>
                </View>
                <View style={[styles.incorrectAnswers, isRTL && styles.rtlRow]}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={isDark ? '#FF453A' : '#FF3B30'}
                  />
                  <Text style={[styles.summaryText, { color: colors.textPrimary, fontFamily }]}>
                    {totalQuestions - correctAnswers} {t('exams.questionsIncorrect')}
                  </Text>
                </View>
                <Text style={[styles.summaryHint, { color: colors.textTertiary, fontFamily }]}>
                  {t('exams.tapToShowAll')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={[styles.actionButtons, isRTL && styles.rtlActions]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(student)/exams')}
          >
            <Ionicons name="list" size={20} color="#FFFFFF" />
            <Text style={[styles.primaryButtonText, { fontFamily }]}>
              {t('exams.backToExams')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, {
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.primary
            }]}
            onPress={() => router.push('/')}
          >
            <Ionicons name="home" size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.primary, fontFamily }]}>
              {t('exams.goToDashboard')}
            </Text>
          </TouchableOpacity>
        </View>

        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={`${t('exams.examResults')}: ${resultData?.exam?.title || t('exams.results')}`}
          link={generateExamResultsLink(
            resultData?.submission?.id || '',
            { title: resultData?.exam?.title }
          )}
          subject={t('exams.examResults')}
        />
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
    paddingBottom: 70,
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
  rtlRow: {
    flexDirection: 'row-reverse',
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
  feedbackCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: designTokens.borderRadius.xl,
    borderWidth: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
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
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  pendingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  pendingNoteText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  correctAnswerSection: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  correctAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  correctAnswerValue: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  explanationSection: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 20,
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
  rtlActions: {
    alignItems: 'flex-end',
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
