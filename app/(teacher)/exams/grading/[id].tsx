// app/(teacher)/exams/grading/[id].tsx - Enhanced with Correct Answers & Explanations
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/src/contexts/ThemeContext';
import { useTranslation } from "@/hooks/useTranslation";
import Alert from '@/components/Alert';

interface Question {
  id: string;
  question: string;
  type: string;
  points: number;
  correct_answer?: string;
  options?: string[];
  explanation?: string;
}

interface Answer {
  question_id: string;
  answer: string;
  is_correct: boolean;
  points: number;
  needs_grading?: boolean;
}

interface Submission {
  id: string;
  exam: {
    title: string;
    subject: string;
    questions: Question[];
  };
  student: {
    id: string;
    profile: {
      name: string;
    };
  };
  answers: Answer[];
  total_points: number;
  score: number;
}

export default function SubmissionGradingScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { colors, fontFamily } = useThemeContext();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New states for correct answers and explanations
  const [correctAnswers, setCorrectAnswers] = useState<Record<string, string>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadSubmission();
    }
  }, [id]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSubmissionForGrading(id as string);

      if (response.data.success) {
        const data = response.data.data;

        if (!data) return;

        const safeAnswers = Array.isArray(data.answers) ? data.answers : [];
        const safeExam = data.exam || {};
        const safeQuestions = Array.isArray(safeExam.questions) ? safeExam.questions : [];
        const safeStudent = data.student || { profile: { name: 'Unknown Student' } };

        const safeSubmission: Submission = {
          id: data.id || '',
          exam: {
            title: safeExam.title || 'Unknown Exam',
            subject: safeExam.subject || 'Unknown Subject',
            questions: safeQuestions
          },
          student: safeStudent,
          answers: safeAnswers,
          total_points: data.total_points || 0,
          score: data.score || 0
        };

        setSubmission(safeSubmission);

        // Initialize grades with existing points or 0
        const initialGrades: Record<string, number> = {};
        const initialCorrectAnswers: Record<string, string> = {};
        const initialExplanations: Record<string, string> = {};

        safeAnswers.forEach((answer: Answer) => {
          initialGrades[answer.question_id] = answer.points || 0;
        });

        // Initialize correct answers and explanations from questions
        safeQuestions.forEach((question: Question) => {
          initialCorrectAnswers[question.id] = question.correct_answer || '';
          initialExplanations[question.id] = question.explanation || '';
        });

        setGrades(initialGrades);
        setCorrectAnswers(initialCorrectAnswers);
        setExplanations(initialExplanations);
      }
    } catch (error) {
      console.error('Failed to load submission:', error);
      Alert.alert(t('common.error'), t('exams.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (questionId: string, points: number) => {
    if (!submission) return;

    const question = submission.exam.questions.find(q => q.id === questionId);
    if (question) {
      const maxPoints = question.points;
      const clampedPoints = Math.max(0, Math.min(maxPoints, points));
      setGrades(prev => ({ ...prev, [questionId]: clampedPoints }));
    }
  };

  const calculateTotalScore = () => {
    if (!submission) return 0;

    const answers = Array.isArray(submission.answers) ? submission.answers : [];

    // Sum all grades (both manual and auto-graded)
    let total = 0;
    answers.forEach(answer => {
      if (answer) {
        const manualGrade = grades[answer.question_id];
        total += (manualGrade !== undefined) ? manualGrade : (answer.points || 0);
      }
    });

    return total;
  };

  const handleSubmitGrading = async () => {
    if (!submission) return;

    try {
      setSubmitting(true);

      const answers = Array.isArray(submission.answers) ? submission.answers : [];

      // Prepare updated answers with all grades
      const updatedAnswers = answers.map(answer => {
        if (answer) {
          const manualGrade = grades[answer.question_id];
          const points = (manualGrade !== undefined) ? manualGrade : (answer.points || 0);

          return {
            ...answer,
            points: points,
            is_correct: points > 0
          };
        }
        return answer;
      });

      // Update questions with new correct answers and explanations
      const updatedQuestions = submission.exam.questions.map(question => ({
        ...question,
        correct_answer: correctAnswers[question.id] || question.correct_answer,
        explanation: explanations[question.id] || question.explanation
      }));

      const totalScore = calculateTotalScore();

      // Submit grading with updated questions
      await apiService.manuallyGradeSubmission(
        submission.id,
        totalScore,
        feedback,
        updatedAnswers,
        updatedQuestions // Pass updated questions
      );

      try {
        await apiService.sendLocalizedNotification(
          submission.student.id,
          'exams.gradingCompleteTitle',
          'exams.gradingCompleteBody',
          {
            examTitle: submission.exam.title, // You might want to fetch the actual exam title
            score: totalScore,
            totalPoints: submission.total_points
          },
          {
            screen: 'exam-results',
            submissionId: submission.id,
            type: 'grading_complete'
          }
        );
      } catch (notificationError) {
        console.log('Failed to send grading notification:', notificationError);
      }

      Alert.alert(t('common.success'), t('exams.gradingSubmitted'), [
        { text: t('common.ok'), onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Failed to submit grading:', error);
      Alert.alert(t('common.error'), t('exams.gradingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          fontFamily,
          color: colors.textSecondary,
          marginTop: 16,
          fontSize: 16
        }}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Ionicons name="alert-circle" size={64} color={colors.textTertiary} />
        <Text style={{
          fontFamily,
          color: colors.textPrimary,
          marginTop: 16,
          fontSize: 18,
          fontWeight: '600',
          textAlign: 'center'
        }}>
          {t('exams.submissionNotFound')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 24
          }}
        >
          <Text style={{
            fontFamily,
            color: '#fff',
            fontWeight: '600'
          }}>
            {t('common.goBack')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const safeAnswers = Array.isArray(submission.answers) ? submission.answers : [];
  const totalScore = calculateTotalScore();
  const maxScore = submission.total_points;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingBottom: 70 }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: colors.backgroundElevated,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background
            }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{
            fontFamily,
            fontSize: 22,
            fontWeight: '700',
            color: colors.textPrimary,
            marginLeft: 12,
            flex: 1
          }}>
            {t('exams.gradeSubmission')}
          </Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={{
            fontFamily,
            fontSize: 20,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 4
          }} numberOfLines={2}>
            {submission.exam.title}
          </Text>
          <Text style={{
            fontFamily,
            fontSize: 16,
            color: colors.textSecondary
          }}>
            {submission.exam.subject}
          </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person" size={16} color={colors.textTertiary} />
            <Text style={{
              fontFamily,
              fontSize: 15,
              color: colors.textPrimary,
              marginLeft: 8
            }}>
              {submission.student.profile?.name || 'Unknown Student'}
            </Text>
          </View>

          <View style={{
            backgroundColor: colors.primary + '15',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16
          }}>
            <Text style={{
              fontFamily,
              fontSize: 15,
              fontWeight: '600',
              color: colors.primary
            }}>
              {totalScore}/{maxScore}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* All Questions */}
        {submission.exam.questions.map((question, index) => {
          const answer = safeAnswers.find(a => a?.question_id === question.id);
          const currentGrade = grades[question.id] !== undefined ? grades[question.id] : (answer?.points || 0);
          const maxPoints = question.points || 1;
          const correctAnswer = correctAnswers[question.id] || question.correct_answer || '';
          const explanation = explanations[question.id] || question.explanation || '';

          return (
            <View
              key={question.id}
              style={{
                backgroundColor: colors.backgroundElevated,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 0.5,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 2,
                elevation: 1
              }}
            >
              {/* Question Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16
              }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{
                    fontFamily,
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    lineHeight: 22
                  }}>
                    {index + 1}. {question.question}
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8
                  }}>
                    <View style={{
                      backgroundColor: question.type === 'text' ? colors.warning + '20' : colors.success + '20',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginRight: 8
                    }}>
                      <Text style={{
                        fontFamily,
                        fontSize: 12,
                        color: question.type === 'text' ? colors.warning : colors.success,
                        fontWeight: '600'
                      }}>
                        {question.type === 'text' ? t('exams.textAnswer') : t('exams.multipleChoice')}
                      </Text>
                    </View>
                    <Text style={{
                      fontFamily,
                      fontSize: 14,
                      color: colors.textSecondary
                    }}>
                      {maxPoints} {t('exams.points')}
                    </Text>
                  </View>
                </View>

                <View style={{
                  backgroundColor: colors.primary + '15',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12
                }}>
                  <Text style={{
                    fontFamily,
                    fontSize: 14,
                    fontWeight: '700',
                    color: colors.primary
                  }}>
                    {currentGrade}/{maxPoints}
                  </Text>
                </View>
              </View>

              {/* Answer Section */}
              <View style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              }}>
                <Text style={{
                  fontFamily,
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginBottom: 8,
                  fontWeight: '500'
                }}>
                  {t('exams.studentAnswer')}
                </Text>

                {answer ? (
                  <Text style={{
                    fontFamily,
                    fontSize: 15,
                    color: colors.textPrimary,
                    lineHeight: 20
                  }}>
                    {answer.answer || t('exams.noAnswer')}
                  </Text>
                ) : (
                  <Text style={{
                    fontFamily,
                    fontSize: 15,
                    color: colors.textTertiary,
                    fontStyle: 'italic'
                  }}>
                    {t('exams.noAnswer')}
                  </Text>
                )}

                {/* MCQ Options Display */}
                {question.type === 'mcq' && question.options && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{
                      fontFamily,
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginBottom: 8,
                      fontWeight: '500'
                    }}>
                      {t('exams.correctAnswer')}
                    </Text>
                    <View style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8
                    }}>
                      {question.options.map((option, optIndex) => (
                        <View
                          key={optIndex}
                          style={{
                            backgroundColor: option === question.correct_answer ? colors.success + '20' : colors.backgroundElevated,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: option === question.correct_answer ? colors.success : colors.border
                          }}
                        >
                          <Text style={{
                            fontFamily,
                            fontSize: 13,
                            color: option === question.correct_answer ? colors.success : colors.textPrimary
                          }}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Correct Answer Section (for text questions) */}
              {question.type === 'text' && (
                <View style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <Text style={{
                      fontFamily,
                      fontSize: 13,
                      color: colors.textSecondary,
                      fontWeight: '500'
                    }}>
                      {t('exams.correctAnswer')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setCorrectAnswers(prev => ({
                        ...prev,
                        [question.id]: ''
                      }))}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    value={correctAnswer}
                    onChangeText={(text) => setCorrectAnswers(prev => ({
                      ...prev,
                      [question.id]: text
                    }))}
                    placeholder={t('exams.enterCorrectAnswer')}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    textAlignVertical="top"
                    style={{
                      fontFamily,
                      fontSize: 15,
                      color: colors.textPrimary,
                      minHeight: 60,
                      paddingTop: 4
                    }}
                  />
                </View>
              )}

              {/* Explanation Section */}
              <View style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Text style={{
                    fontFamily,
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontWeight: '500'
                  }}>
                    {t('exams.explanation')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setExplanations(prev => ({
                      ...prev,
                      [question.id]: ''
                    }))}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={explanation}
                  onChangeText={(text) => setExplanations(prev => ({
                    ...prev,
                    [question.id]: text
                  }))}
                  placeholder={t('exams.enterExplanation')}
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                  style={{
                    fontFamily,
                    fontSize: 15,
                    color: colors.textPrimary,
                    minHeight: 60,
                    paddingTop: 4
                  }}
                />
              </View>

              {/* Grading Controls */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Text style={{
                  fontFamily,
                  fontSize: 15,
                  color: colors.textPrimary,
                  fontWeight: '500'
                }}>
                  {t('exams.assignPoints')}
                </Text>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.background,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <TouchableOpacity
                    onPress={() => handleGradeChange(question.id, currentGrade - 1)}
                    style={{
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    disabled={currentGrade <= 0}
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={currentGrade <= 0 ? colors.textTertiary : colors.textPrimary}
                    />
                  </TouchableOpacity>

                  <View style={{
                    width: 60,
                    alignItems: 'center'
                  }}>
                    <Text style={{
                      fontFamily,
                      fontSize: 16,
                      fontWeight: '700',
                      color: colors.textPrimary
                    }}>
                      {currentGrade}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleGradeChange(question.id, currentGrade + 1)}
                    style={{
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    disabled={currentGrade >= maxPoints}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={currentGrade >= maxPoints ? colors.textTertiary : colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Slider for precise grading */}
              <View style={{
                marginTop: 16,
                height: 40,
                justifyContent: 'center'
              }}>
                <View style={{
                  height: 6,
                  backgroundColor: colors.border,
                  borderRadius: 3
                }}>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.primary,
                      borderRadius: 3,
                      width: `${(currentGrade / maxPoints) * 100}%`
                    }}
                  />
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 4
                }}>
                  <Text style={{
                    fontFamily,
                    fontSize: 12,
                    color: colors.textTertiary
                  }}>
                    0
                  </Text>
                  <Text style={{
                    fontFamily,
                    fontSize: 12,
                    color: colors.textTertiary
                  }}>
                    {maxPoints}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Feedback Section */}
        <View style={{
          backgroundColor: colors.backgroundElevated,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          borderWidth: 0.5,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 2,
          elevation: 1
        }}>
          <Text style={{
            fontFamily,
            fontSize: 18,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 16
          }}>
            {t('exams.feedback')}
          </Text>

          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            placeholder={t('exams.feedbackPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            style={{
              backgroundColor: colors.background,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: colors.textPrimary,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 120,
              fontFamily
            }}
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={{
        padding: 20,
        backgroundColor: colors.backgroundElevated,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3
      }}>
        <TouchableOpacity
          onPress={handleSubmitGrading}
          disabled={submitting}
          style={{
            backgroundColor: submitting ? colors.textTertiary : colors.primary,
            borderRadius: 28,
            paddingVertical: 18,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5
          }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{
              fontFamily,
              fontSize: 18,
              fontWeight: '700',
              color: '#fff'
            }}>
              {t('exams.submitGrading')} • {totalScore}/{maxScore}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
