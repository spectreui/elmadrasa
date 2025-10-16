// app/(teacher)/homework/[id]/submissions.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, RefreshControl, StyleSheet, I18nManager } from 'react-native';
import Alert from '@/components/Alert';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { apiService } from '../../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../../../src/utils/designTokens';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useTranslation } from "@/hooks/useTranslation";

interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice';
  options?: string[];
  points: number;
}

interface Answer {
  question_id: string;
  answer: string;
}

interface QuestionGrade {
  question_id: string;
  grade: number | null;
  feedback: string | null;
}

interface Submission {
  id: string;
  student_id: string;
  homework_id: string;
  submitted_at: string;
  content: string;
  attachments: string[];
  answers?: Answer[];
  question_grades?: QuestionGrade[];
  grade?: number;
  feedback?: string;
  text_grade?: number;
  graded_at?: string;
  student?: {
    id: string;
    profile: {
      name: string;
      class?: string;
    };
  };
}

interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  due_date: string;
  start_date: string;
  points: number;
  attachments: boolean;
  allow_questions: boolean;
  questions?: Question[];
  teacher_id: string;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    profile: {
      name: string;
    };
  };
}

export default function HomeworkSubmissionsScreen() {
  const { t, isRTL } = useTranslation();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [textGrade, setTextGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [questionGrades, setQuestionGrades] = useState<Record<string, { grade: string; feedback: string; }>>({});
  const [grading, setGrading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, isDark } = useThemeContext();

  useEffect(() => {
    loadHomeworkAndSubmissions();
  }, [id]);

  const loadHomeworkAndSubmissions = async () => {
    try {
      setLoading(true);

      // Load homework details
      const homeworkResponse = await apiService.getHomeworkById(id as string);
      if (homeworkResponse.data.success) {
        setHomework(homeworkResponse.data.data);
      } else {
        throw new Error(homeworkResponse.data.error || 'Failed to load homework');
      }

      // Load submissions using the real API endpoint
      const submissionsResponse = await apiService.getHomeworkSubmissions(id as string);
      if (submissionsResponse.data.success) {
        setSubmissions(submissionsResponse.data.data || []);
      } else {
        throw new Error(submissionsResponse.data.error || 'Failed to load submissions');
      }

    } catch (error: any) {
      console.error('Failed to load homework submissions:', error);
      Alert.alert('Error', error.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHomeworkAndSubmissions();
  };

  const handleGradeSubmission = async () => {
    if (!gradingSubmission) {
      Alert.alert('Error', 'No submission selected');
      return;
    }

    // Validate text grade
    const textGradeValue = parseInt(textGrade) || 0;
    const totalQuestionPoints = homework?.questions?.reduce((sum, q) => sum + q.points, 0) || 0;
    const maxTextGrade = (homework?.points || 0) - totalQuestionPoints;

    if (textGradeValue < 0 || textGradeValue > maxTextGrade) {
      Alert.alert('Error', `Text submission grade must be between 0 and ${maxTextGrade}`);
      return;
    }

    setGrading(true);
    try {
      // Prepare question grades
      const questionGradesArray = Object.entries(questionGrades).
        filter(([_, gradeData]) => gradeData.grade !== '') // Only include questions with grades
        .map(([questionId, gradeData]) => ({
          question_id: questionId,
          grade: parseInt(gradeData.grade) || 0,
          feedback: gradeData.feedback || null
        }));

      // Use the real grading API endpoint
      const response = await apiService.gradeSubmission(
        gradingSubmission.id,
        textGradeValue,
        feedback,
        questionGradesArray
      );

      if (response.data.success) {
        // Update local state with the graded submission
        setSubmissions((prev) => prev.map((sub) =>
          sub.id === gradingSubmission.id ?
            {
              ...response.data.data,
              text_grade: textGradeValue,
              question_grades: questionGradesArray
            } :
            sub
        ));

        // ✅ Send push notification through your backend
        try {
          await apiService.sendLocalizedNotification(
            gradingSubmission.student_id,
            'submissions.graded',
            'submissions.gradedBody',
            {
              title: homework?.title || 'homework',
              grade: textGradeValue
            },
            {
              screen: 'homework',
              homeworkId: gradingSubmission.homework_id,
              type: 'submission_graded'
            }
          );
        } catch (notificationError) {
          console.log('Failed to send push notification:', notificationError);
          // Don't fail the whole operation if notification fails
        }

        Alert.alert('Success', 'Submission graded successfully');
        setGradingSubmission(null);
        setTextGrade('');
        setFeedback('');
        setQuestionGrades({});
      } else {
        throw new Error(response.data.error || 'Failed to grade submission');
      }
    } catch (error: any) {
      console.error('Failed to grade submission:', error);
      Alert.alert('Error', error.message || 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const openGradeModal = (submission: Submission) => {
    setGradingSubmission(submission);
    setTextGrade(submission.text_grade?.toString() || submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');

    // Initialize question grades
    const initialQuestionGrades: Record<string, { grade: string; feedback: string; }> = {};
    if (homework?.questions) {
      homework.questions.forEach((question) => {
        const existingGrade = submission.question_grades?.find((qg) => qg.question_id === question.id);
        initialQuestionGrades[question.id] = {
          grade: existingGrade?.grade?.toString() || '',
          feedback: existingGrade?.feedback || ''
        };
      });
    }
    setQuestionGrades(initialQuestionGrades);
  };

  const getGradeColor = (grade?: number) => {
    if (grade === undefined || grade === null) return '#9CA3AF'; // Gray
    if (grade >= 90) return '#10B981'; // Green
    if (grade >= 80) return '#3B82F6'; // Blue
    if (grade >= 70) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const getGradeStatus = (submission: Submission) => {
    if (submission.grade !== undefined && submission.grade !== null) {
      return 'graded';
    }
    return 'pending';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAverageGrade = () => {
    const gradedSubmissions = submissions.filter((s) => s.grade !== undefined && s.grade !== null);
    if (gradedSubmissions.length === 0) return 0;

    const total = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
    return Math.round(total / gradedSubmissions.length);
  };

  const renderSubmissionDetails = (submission: Submission) => {
    if (!submission) return null;

    return (
      <View>
        {/* Main Submission Content */}
        <View style={{ marginBottom: designTokens.spacing.md }}>
          <Text style={{
            fontSize: designTokens.typography.footnote.fontSize,
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: designTokens.spacing.sm,
            textAlign: isRTL ? 'right' : 'left'
          }}>
            {t("submissions.studentContent")}:
          </Text>
          <View style={{
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: isDark ? '#1F2937' : '#F9FAFB'
          }}>
            <Text style={{
              fontSize: designTokens.typography.body.fontSize,
              color: colors.textPrimary,
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {submission.content || t("submissions.noContent")}
            </Text>
          </View>
        </View>

        {/* Questions and Answers Section with Grades */}
        {homework?.allow_questions && homework.questions && homework.questions.length > 0 &&
          <View style={{ marginBottom: designTokens.spacing.md }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.md,
              textAlign: isRTL ? 'right' : 'left'
            } as any}>{t("submissions.questionsAnswers")}

            </Text>
            {homework.questions.map((question, index) => {
              const answer = submission.answers?.find((a) => a.question_id === question.id);
              const questionGrade = submission.question_grades?.find((qg) => qg.question_id === question.id);

              return (
                <View
                  key={question.id}
                  style={{
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElevated,
                    marginBottom: designTokens.spacing.sm
                  }}>

                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.xs,
                    textAlign: isRTL ? 'right' : 'left'
                  }}>
                    {index + 1}. {question.text} ({question.points} {t("common.points")})
                  </Text>

                  {question.type === 'multiple_choice' && question.options &&
                    <View style={{ marginBottom: designTokens.spacing.xs }}>
                      {question.options.map((option, optionIndex) =>
                        <Text key={optionIndex} style={{
                          fontSize: designTokens.typography.caption1.fontSize,
                          color: colors.textSecondary,
                          marginLeft: isRTL ? 0 : designTokens.spacing.md,
                          marginRight: isRTL ? designTokens.spacing.md : 0,
                          textAlign: isRTL ? 'right' : 'left'
                        }}>
                          {isRTL ?
                            `${option} .${String.fromCharCode(1632 + optionIndex)}` :
                            `${String.fromCharCode(65 + optionIndex)}. ${option}`
                          }
                        </Text>
                      )}
                    </View>
                  }

                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textSecondary,
                    marginBottom: designTokens.spacing.xs,
                    textAlign: isRTL ? 'right' : 'left'
                  }}>
                    {t("submissions.studentAnswer")}: {answer ? answer.answer : t("submissions.noAnswer")}
                  </Text>

                  {questionGrade && (questionGrade.grade !== null && questionGrade.grade !== undefined || questionGrade.feedback) &&
                    <View style={{
                      marginTop: designTokens.spacing.xs,
                      padding: designTokens.spacing.sm,
                      borderRadius: designTokens.borderRadius.md,
                      backgroundColor: isDark ? '#374151' : '#E5E7EB'
                    }}>
                      {questionGrade.grade !== null && questionGrade.grade !== undefined &&
                        <Text style={{
                          fontSize: designTokens.typography.caption1.fontSize,
                          color: questionGrade.grade === question.points ? '#10B981' : '#F59E0B',
                          fontWeight: '600',
                          textAlign: isRTL ? 'right' : 'left'
                        }}>
                          {t("submissions.grade")}: {questionGrade.grade}/{question.points}
                        </Text>
                      }
                      {questionGrade.feedback &&
                        <Text style={{
                          fontSize: designTokens.typography.caption1.fontSize,
                          color: colors.textSecondary,
                          marginTop: designTokens.spacing.xs,
                          textAlign: isRTL ? 'right' : 'left'
                        }}>
                          {t("submissions.feedback")}: {questionGrade.feedback}
                        </Text>
                      }
                    </View>
                  }
                </View>);

            })}
          </View>
        }

        {/* Attachments */}
        {submission.attachments && submission.attachments.length > 0 &&
          <View style={{ marginBottom: designTokens.spacing.md }}>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.sm,
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {t("submissions.attachments")}:
            </Text>
            <View style={{ gap: designTokens.spacing.sm }}>
              {submission.attachments.map((attachment, index) =>
                <View
                  key={index}
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.lg,
                    backgroundColor: isDark ? '#1F2937' : '#F9FAFB'
                  }}>

                  <Ionicons name="document" size={20} color={colors.textSecondary} />
                  <Text
                    style={{
                      marginHorizontal: designTokens.spacing.sm,
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                      flex: 1,
                      textAlign: isRTL ? 'right' : 'left'
                    }}
                    numberOfLines={1}>

                    {attachment}
                  </Text>
                </View>
              )}
            </View>
          </View>
        }

        {/* Overall Grade and Feedback */}
        {submission.grade !== undefined && submission.grade !== null &&
          <View style={{
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: '#10B98115',
            borderWidth: 1,
            borderColor: '#10B98140',
            marginBottom: designTokens.spacing.md
          }}>
            <Text style={{
              fontSize: designTokens.typography.body.fontSize,
              fontWeight: '600',
              color: '#059669',
              marginBottom: designTokens.spacing.xs,
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {t("submissions.overallGrade")}: {submission.grade}/{homework.points}
            </Text>

            {/* Component grades */}
            {submission.text_grade !== undefined && submission.text_grade !== null &&
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: '#059669',
                marginTop: designTokens.spacing.xs,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("submissions.textSubmission")}: {submission.text_grade} {t("common.points")}
              </Text>
            }

            {submission.question_grades && submission.question_grades.length > 0 &&
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: '#059669',
                marginTop: designTokens.spacing.xs,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("submissions.questionPoints")}: {submission.question_grades.reduce((sum, qg) => sum + (qg.grade || 0), 0)} {t("common.points")}
              </Text>
            }

            {submission.feedback &&
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: '#059669',
                marginTop: designTokens.spacing.sm,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("submissions.overallFeedback")}: {submission.feedback}
              </Text>
            }

            <Text style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: '#059669',
              marginTop: designTokens.spacing.xs,
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {t("submissions.submittedOn")}: {formatDate(submission.submitted_at)}
            </Text>
            {submission.graded_at &&
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: '#059669',
                marginTop: designTokens.spacing.xs,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("submissions.gradedOn")}: {formatDate(submission.graded_at)}
              </Text>
            }
          </View>
        }
      </View>);

  };

  const getGradeStatusBadge = (submission: Submission) => {
    if (getGradeStatus(submission) === 'graded') {
      return (
        <View style={{
          paddingHorizontal: designTokens.spacing.md,
          paddingVertical: designTokens.spacing.xs,
          borderRadius: designTokens.borderRadius.full,
          backgroundColor: '#10B98115'
        }}>
          <Text style={{
            fontSize: designTokens.typography.caption1.fontSize,
            fontWeight: '600',
            color: '#10B981',
            textAlign: isRTL ? 'right' : 'left'
          }}>{t("submissions.graded")}

          </Text>
        </View>);

    } else {
      return (
        <View style={{
          paddingHorizontal: designTokens.spacing.md,
          paddingVertical: designTokens.spacing.xs,
          borderRadius: designTokens.borderRadius.full,
          backgroundColor: '#F59E0B15'
        }}>
          <Text style={{
            fontSize: designTokens.typography.caption1.fontSize,
            fontWeight: '600',
            color: '#F59E0B',
            textAlign: isRTL ? 'right' : 'left'
          }}>{t("common.pending")}

          </Text>
        </View>);

    }
  };

  if (loading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          marginTop: designTokens.spacing.md,
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
          textAlign: 'center'
        }}>
          {t("common.loading")}...
        </Text>
      </View>);

  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: designTokens.spacing.xl,
        paddingTop: designTokens.spacing.xxxl,
        paddingBottom: designTokens.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.backgroundElevated
      }}>
        <View style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          marginBottom: designTokens.spacing.lg
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center'
            }}>

            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={colors.textSecondary} />
            <Text style={{
              marginHorizontal: designTokens.spacing.sm,
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              textAlign: isRTL ? 'right' : 'left'
            }}>{t("common.back")}

            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{
          fontSize: designTokens.typography.title1.fontSize,
          fontWeight: designTokens.typography.title1.fontWeight,
          color: colors.textPrimary,
          marginBottom: designTokens.spacing.sm,
          textAlign: isRTL ? 'right' : 'left'
        } as any}>
          {homework?.title}
        </Text>

        <Text style={{
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
          marginBottom: designTokens.spacing.md,
          textAlign: isRTL ? 'right' : 'left'
        }}>
          {homework?.class} • {t(homework?.subject)} • {isRTL ? `${t("submissions.title")} ${submissions.length}` : `${submissions.length} ${t("submissions.title")}`}

        </Text>

        {/* Quick Stats */}
        <View style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          justifyContent: 'space-between',
          gap: designTokens.spacing.sm
        }}>
          <View style={{
            flex: 1,
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: '#3B82F615',
            borderWidth: 1,
            borderColor: '#3B82F640'
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: '#3B82F6',
              textAlign: 'center'
            } as any}>
              {submissions.length}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: '#3B82F6',
              textAlign: 'center'
            }}>{t("submissions.submitted")}

            </Text>
          </View>
          <View style={{
            flex: 1,
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: '#10B98115',
            borderWidth: 1,
            borderColor: '#10B98140'
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: '#10B981',
              textAlign: 'center'
            } as any}>
              {submissions.filter((s) => s.grade !== undefined && s.grade !== null).length}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: '#10B981',
              textAlign: 'center'
            }}>{t("submissions.graded")}

            </Text>
          </View>
          <View style={{
            flex: 1,
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: '#F59E0B15',
            borderWidth: 1,
            borderColor: '#F59E0B40'
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: '#F59E0B',
              textAlign: 'center'
            } as any}>
              {submissions.filter((s) => s.grade === undefined || s.grade === null).length}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: '#F59E0B',
              textAlign: 'center'
            }}>{t("common.pending")}

            </Text>
          </View>
          <View style={{
            flex: 1,
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: '#8B5CF615',
            borderWidth: 1,
            borderColor: '#8B5CF640'
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: '#8B5CF6',
              textAlign: 'center'
            } as any}>
              {calculateAverageGrade()}%
            </Text>
            <Text style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: '#8B5CF6',
              textAlign: 'center'
            }}>{t("submissions.avgGrade")}

            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]} />

        }>

        <View style={{
          padding: designTokens.spacing.xl,
          paddingTop: designTokens.spacing.lg
        }}>
          {submissions.length === 0 ?
            <View style={{
              alignItems: 'center',
              padding: designTokens.spacing.xxl,
              borderRadius: designTokens.borderRadius.xl,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              backgroundColor: colors.backgroundElevated
            }}>
              <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} style={{ marginBottom: designTokens.spacing.lg }} />
              <Text style={{
                fontSize: designTokens.typography.title2.fontSize,
                fontWeight: designTokens.typography.title2.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.sm,
                textAlign: 'center'
              } as any}>{t("submissions.none")}

              </Text>
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textSecondary,
                textAlign: 'center'
              }}>{t("submissions.noneMessage")}

              </Text>
            </View> :

            submissions.map((submission) =>
              <View
                key={submission.id}
                style={{
                  borderRadius: designTokens.borderRadius.xxl,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundElevated,
                  padding: designTokens.spacing.lg,
                  marginBottom: designTokens.spacing.md,
                  ...designTokens.shadows.sm
                }}>

                <View style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: designTokens.spacing.md
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: designTokens.typography.headline.fontSize,
                      fontWeight: designTokens.typography.headline.fontWeight,
                      color: colors.textPrimary,
                      marginBottom: designTokens.spacing.xs,
                      textAlign: isRTL ? 'right' : 'left'
                    } as any}>
                      {submission.student?.profile?.name || 'Student'}
                    </Text>
                    <Text style={{
                      fontSize: designTokens.typography.caption1.fontSize,
                      color: colors.textSecondary,
                      textAlign: isRTL ? 'right' : 'left'
                    }}>
                      {submission.student?.profile?.class && `${submission.student.profile.class} • `}{t("submissions.submitted")}
                      {formatDate(submission.submitted_at)}
                    </Text>
                  </View>
                  {getGradeStatusBadge(submission)}
                </View>

                {/* Grade Display */}
                {getGradeStatus(submission) === 'graded' &&
                  <View style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.lg,
                    backgroundColor: '#10B98115',
                    borderWidth: 1,
                    borderColor: '#10B98140',
                    marginBottom: designTokens.spacing.md
                  }}>
                    <View>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        fontWeight: '600',
                        color: '#10B981',
                        textAlign: isRTL ? 'right' : 'left'
                      }}>
                        {t("submissions.overallGrade")}: {submission.grade}/{homework?.points}
                      </Text>
                      {submission.question_grades && submission.question_grades.some((qg) => qg.grade !== null) &&
                        <Text style={{
                          fontSize: designTokens.typography.caption1.fontSize,
                          color: '#10B981',
                          marginTop: designTokens.spacing.xs,
                          textAlign: isRTL ? 'right' : 'left'
                        }}>
                          {t("submissions.questionGrades")}: {submission.question_grades.filter((qg) => qg.grade !== null).length} {t("submissions.graded")}
                        </Text>
                      }
                    </View>
                  </View>
                }

                {/* Use the new render function */}
                {renderSubmissionDetails(submission)}

                <TouchableOpacity
                  onPress={() => openGradeModal(submission)}
                  style={{
                    paddingVertical: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.lg,
                    backgroundColor: getGradeStatus(submission) === 'graded' ?
                      colors.background :
                      colors.primary,
                    borderWidth: 1,
                    borderColor: getGradeStatus(submission) === 'graded' ?
                      colors.border :
                      colors.primary,
                    alignItems: 'center'
                  }}>

                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: getGradeStatus(submission) === 'graded' ?
                      colors.textPrimary :
                      'white',
                    textAlign: 'center'
                  }}>
                    {getGradeStatus(submission) === 'graded' ? t("submissions.editGrade") : t("submissions.grade")}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
        </View>
      </ScrollView>

      {/* Grading Modal */}
      <Modal
        visible={!!gradingSubmission}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setGradingSubmission(null)}>

        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            paddingHorizontal: designTokens.spacing.xl,
            paddingTop: designTokens.spacing.xxxl,
            paddingBottom: designTokens.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.backgroundElevated
          }}>
            <View style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: designTokens.spacing.lg
            }}>
              <Text style={{
                fontSize: designTokens.typography.title2.fontSize,
                fontWeight: designTokens.typography.title2.fontWeight,
                color: colors.textPrimary,
                textAlign: isRTL ? 'right' : 'left'
              } as any}>{t("submissions.grade")}

              </Text>
              <TouchableOpacity
                onPress={() => setGradingSubmission(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? '#374151' : '#E5E7EB'
                }}>

                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{
              fontSize: designTokens.typography.headline.fontSize,
              color: colors.textSecondary,
              textAlign: isRTL ? 'right' : 'left'
            } as any}>
              {gradingSubmission?.student?.profile?.name}
            </Text>
            {gradingSubmission &&
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textSecondary,
                marginTop: designTokens.spacing.xs,
                textAlign: isRTL ? 'right' : 'left'
              }}>{t("submissions.submittedOn")}
                {formatDate(gradingSubmission.submitted_at)}
              </Text>
            }
          </View>

          <ScrollView style={{ flex: 1 }}>
            <View style={{
              padding: designTokens.spacing.xl,
              paddingBottom: designTokens.spacing.xxxl
            }}>
              {/* Submission Content Preview */}
              {gradingSubmission?.content &&
                <View style={{ marginBottom: designTokens.spacing.xl }}>
                  <Text style={{
                    fontSize: designTokens.typography.title3.fontSize,
                    fontWeight: designTokens.typography.title3.fontWeight,
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.md,
                    textAlign: isRTL ? 'right' : 'left'
                  } as any}>{t("submissions.studentContent")}

                  </Text>
                  <View style={{
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElevated
                  }}>
                    <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                      textAlign: isRTL ? 'right' : 'left'
                    }}>
                      {gradingSubmission.content}
                    </Text>
                  </View>
                </View>
              }

              {/* Questions and Answers Preview with Grading */}
              {homework?.allow_questions && homework.questions && homework.questions.length > 0 &&
                <View style={{ marginBottom: designTokens.spacing.xl }}>
                  <Text style={{
                    fontSize: designTokens.typography.title3.fontSize,
                    fontWeight: designTokens.typography.title3.fontWeight,
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.md,
                    textAlign: isRTL ? 'right' : 'left'
                  } as any}>
                    {t("submissions.questionsAnswers")}
                  </Text>
                  {homework.questions.map((question, index) => {
                    const answer = gradingSubmission?.answers?.find((a) => a.question_id === question.id);
                    const currentGrade = questionGrades[question.id]?.grade || '';
                    const currentFeedback = questionGrades[question.id]?.feedback || '';

                    return (
                      <View
                        key={question.id}
                        style={{
                          padding: designTokens.spacing.md,
                          borderRadius: designTokens.borderRadius.lg,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.backgroundElevated,
                          marginBottom: designTokens.spacing.md
                        }}>

                        <Text style={{
                          fontSize: designTokens.typography.body.fontSize,
                          fontWeight: '600',
                          color: colors.textPrimary,
                          marginBottom: designTokens.spacing.xs,
                          textAlign: isRTL ? 'right' : 'left'
                        }}>
                          {index + 1}. {question.text} ({question.points} {t("common.points")})
                        </Text>

                        {question.type === 'multiple_choice' && question.options &&
                          <View style={{ marginBottom: designTokens.spacing.xs }}>
                            {question.options.map((option, optionIndex) =>
                              <Text key={optionIndex} style={{
                                fontSize: designTokens.typography.caption1.fontSize,
                                color: colors.textSecondary,
                                marginLeft: isRTL ? 0 : designTokens.spacing.md,
                                marginRight: isRTL ? designTokens.spacing.md : 0,
                                textAlign: isRTL ? 'right' : 'left'
                              }}>
                                {isRTL ?
                                  `${option} .${String.fromCharCode(1632 + optionIndex)}` :
                                  `${String.fromCharCode(65 + optionIndex)}. ${option}`
                                }
                              </Text>
                            )}
                          </View>
                        }

                        <Text style={{
                          fontSize: designTokens.typography.body.fontSize,
                          color: colors.textSecondary,
                          marginBottom: designTokens.spacing.md,
                          textAlign: isRTL ? 'right' : 'left'
                        }}>
                          {t("submissions.answer")}: {answer ? answer.answer : t("submissions.noAnswer")}
                        </Text>

                        {/* Question Grade Input */}
                        <View style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          marginBottom: designTokens.spacing.sm
                        }}>
                          <Text style={{
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textPrimary,
                            marginHorizontal: designTokens.spacing.sm,
                            width: 80,
                            textAlign: isRTL ? 'right' : 'left'
                          }}>
                            {t("submissions.grade")}:
                          </Text>
                          <TextInput
                            style={{
                              flex: 1,
                              borderRadius: designTokens.borderRadius.md,
                              padding: designTokens.spacing.sm,
                              borderWidth: 1,
                              borderColor: colors.border,
                              backgroundColor: colors.background,
                              fontSize: designTokens.typography.body.fontSize,
                              color: colors.textPrimary,
                              textAlign: isRTL ? 'right' : 'left'
                            }}
                            placeholder={`0-${question.points}`}
                            keyboardType="numeric"
                            value={currentGrade}
                            onChangeText={(text) => {
                              const numericValue = text.replace(/[^0-9]/g, '');
                              if (numericValue === '' || parseInt(numericValue) <= question.points) {
                                setQuestionGrades((prev) => ({
                                  ...prev,
                                  [question.id]: {
                                    ...prev[question.id],
                                    grade: numericValue
                                  }
                                }));
                              }
                            }} />

                          <Text style={{
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textPrimary,
                            marginHorizontal: designTokens.spacing.xs,
                            textAlign: isRTL ? 'right' : 'left'
                          }}>
                            / {question.points}
                          </Text>
                        </View>

                        {/* Question Feedback Input */}
                        <View>
                          <Text style={{
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textPrimary,
                            marginBottom: designTokens.spacing.xs,
                            textAlign: isRTL ? 'right' : 'left'
                          }}>
                            {t("submissions.feedback")}:
                          </Text>
                          <TextInput
                            style={{
                              borderRadius: designTokens.borderRadius.md,
                              padding: designTokens.spacing.sm,
                              borderWidth: 1,
                              borderColor: colors.border,
                              backgroundColor: colors.background,
                              fontSize: designTokens.typography.body.fontSize,
                              color: colors.textPrimary,
                              minHeight: 60,
                              textAlignVertical: 'top',
                              textAlign: isRTL ? 'right' : 'left'
                            }}
                            placeholder={t("submissions.addFeedback")}
                            value={currentFeedback}
                            onChangeText={(text) => {
                              setQuestionGrades((prev) => ({
                                ...prev,
                                [question.id]: {
                                  ...prev[question.id],
                                  feedback: text
                                }
                              }));
                            }}
                            multiline />

                        </View>
                      </View>);

                  })}
                </View>
              }

              {/* Text Submission Grade */}
              <View style={{ marginBottom: designTokens.spacing.xl }}>
                <Text style={{
                  fontSize: designTokens.typography.title3.fontSize,
                  fontWeight: designTokens.typography.title3.fontWeight,
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.md,
                  textAlign: isRTL ? 'right' : 'left'
                } as any}>
                  {t("submissions.textSubmissionGrade")}
                </Text>

                <View style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textPrimary,
                    marginHorizontal: designTokens.spacing.sm,
                    width: 80,
                    textAlign: isRTL ? 'right' : 'left'
                  }}>
                    {t("submissions.grade")}:
                  </Text>
                  <TextInput
                    style={{
                      flex: 1,
                      borderRadius: designTokens.borderRadius.md,
                      padding: designTokens.spacing.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                      textAlign: isRTL ? 'right' : 'left'
                    }}
                    placeholder={`0-${(homework?.points || 0) - (homework?.questions?.reduce((sum, q) => sum + q.points, 0) || 0)}`}
                    keyboardType="numeric"
                    value={textGrade}
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9]/g, '');
                      const totalQuestionPoints = homework?.questions?.reduce((sum, q) => sum + q.points, 0) || 0;
                      const maxTextGrade = (homework?.points || 0) - totalQuestionPoints;

                      if (numericValue === '' || parseInt(numericValue) <= maxTextGrade) {
                        setTextGrade(numericValue);
                      }
                    }} />

                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textPrimary,
                    marginHorizontal: designTokens.spacing.xs,
                    textAlign: isRTL ? 'right' : 'left'
                  }}>
                    / {(homework?.points || 0) - (homework?.questions?.reduce((sum, q) => sum + q.points, 0) || 0)}
                  </Text>
                </View>
              </View>

              {/* Overall Feedback Input */}
              <View style={{ marginBottom: designTokens.spacing.xl }}>
                <Text style={{
                  fontSize: designTokens.typography.title3.fontSize,
                  fontWeight: designTokens.typography.title3.fontWeight,
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.md,
                  textAlign: isRTL ? 'right' : 'left'
                } as any}>{t("submissions.overallFeedback")}

                </Text>
                <TextInput
                  style={{
                    borderRadius: designTokens.borderRadius.md,
                    padding: designTokens.spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textPrimary,
                    minHeight: 100,
                    textAlignVertical: 'top',
                    textAlign: isRTL ? 'right' : 'left'
                  }}
                  placeholder={t("submissions.addOverallFeedback")}
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline />

              </View>

              {/* Action Buttons */}
              <View style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                gap: designTokens.spacing.md
              }}>
                <TouchableOpacity
                  onPress={() => setGradingSubmission(null)}
                  style={{
                    flex: 1,
                    paddingVertical: designTokens.spacing.lg,
                    borderRadius: designTokens.borderRadius.lg,
                    backgroundColor: colors.backgroundElevated,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center'
                  }}>

                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: colors.textPrimary
                  }}>{t("common.cancel")}

                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleGradeSubmission}
                  disabled={grading}
                  style={{
                    flex: 1,
                    paddingVertical: designTokens.spacing.lg,
                    borderRadius: designTokens.borderRadius.lg,
                    backgroundColor: grading ? '#93C5FD' : colors.primary,
                    alignItems: 'center'
                  }}>

                  {grading ?
                    <ActivityIndicator color="white" size="small" /> :

                    <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      fontWeight: '600',
                      color: 'white'
                    }}>
                      {t("common.save")}
                    </Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>);

}
