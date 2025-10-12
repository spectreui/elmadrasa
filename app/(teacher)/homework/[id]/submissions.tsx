// app/(teacher)/homework/[id]/submissions.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { apiService } from '../../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../../../src/utils/designTokens';
import { useThemeContext } from '@/contexts/ThemeContext';

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
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [textGrade, setTextGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [questionGrades, setQuestionGrades] = useState<Record<string, { grade: string; feedback: string }>>({});
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
      const questionGradesArray = Object.entries(questionGrades)
        .filter(([_, gradeData]) => gradeData.grade !== '') // Only include questions with grades
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
        setSubmissions(prev => prev.map(sub => 
          sub.id === gradingSubmission.id 
            ? {
                ...response.data.data,
                text_grade: textGradeValue,
                question_grades: questionGradesArray
              }
            : sub
        ));
        
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
    const initialQuestionGrades: Record<string, { grade: string; feedback: string }> = {};
    if (homework?.questions) {
      homework.questions.forEach(question => {
        const existingGrade = submission.question_grades?.find(qg => qg.question_id === question.id);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAverageGrade = () => {
    const gradedSubmissions = submissions.filter(s => s.grade !== undefined && s.grade !== null);
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
          }}>
            Student's Submission Content:
          </Text>
          <View style={{
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
          }}>
            <Text style={{
              fontSize: designTokens.typography.body.fontSize,
              color: colors.textPrimary,
            }}>
              {submission.content || 'No content provided'}
            </Text>
          </View>
        </View>

        {/* Questions and Answers Section with Grades */}
        {homework?.allow_questions && homework.questions && homework.questions.length > 0 && (
          <View style={{ marginBottom: designTokens.spacing.md }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.md,
            } as any}>
              Questions & Student Answers
            </Text>
            {homework.questions.map((question, index) => {
              const answer = submission.answers?.find(a => a.question_id === question.id);
              const questionGrade = submission.question_grades?.find(qg => qg.question_id === question.id);
              
              return (
                <View 
                  key={question.id} 
                  style={{
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElevated,
                    marginBottom: designTokens.spacing.sm,
                  }}
                >
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.xs,
                  }}>
                    {index + 1}. {question.text} ({question.points} pts)
                  </Text>
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <View style={{ marginBottom: designTokens.spacing.xs }}>
                      {question.options.map((option, optionIndex) => (
                        <Text key={optionIndex} style={{
                          fontSize: designTokens.typography.caption1.fontSize,
                          color: colors.textSecondary,
                          marginLeft: designTokens.spacing.md,
                        }}>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </Text>
                      ))}
                    </View>
                  )}
                  
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textSecondary,
                    marginBottom: designTokens.spacing.xs,
                  }}>
                    Student's Answer: {answer ? answer.answer : 'No answer provided'}
                  </Text>
                  
                  {questionGrade && (questionGrade.grade !== null && questionGrade.grade !== undefined || questionGrade.feedback) && (
                    <View style={{
                      marginTop: designTokens.spacing.xs,
                      padding: designTokens.spacing.sm,
                      borderRadius: designTokens.borderRadius.md,
                      backgroundColor: isDark ? '#374151' : '#E5E7EB',
                    }}>
                      {(questionGrade.grade !== null && questionGrade.grade !== undefined) && (
                        <Text style={{
                          fontSize: designTokens.typography.caption1.fontSize,
                          color: questionGrade.grade === question.points ? '#10B981' : '#F59E0B',
                          fontWeight: '600',
                        }}>
                          Grade: {questionGrade.grade}/{question.points}
                        </Text>
                      )}
                      {questionGrade.feedback && (
                        <Text style={{
                          fontSize: designTokens.typography.caption1.fontSize,
                          color: colors.textSecondary,
                          marginTop: designTokens.spacing.xs,
                        }}>
                          Feedback: {questionGrade.feedback}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Attachments */}
        {submission.attachments && submission.attachments.length > 0 && (
          <View style={{ marginBottom: designTokens.spacing.md }}>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.sm,
            }}>
              Attachments:
            </Text>
            <View style={{ gap: designTokens.spacing.sm }}>
              {submission.attachments.map((attachment, index) => (
                <View 
                  key={index} 
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.lg,
                    backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                  }}
                >
                  <Ionicons name="document" size={20} color={colors.textSecondary} />
                  <Text 
                    style={{
                      marginLeft: designTokens.spacing.sm,
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {attachment}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Overall Grade and Feedback */}
        {(submission.grade !== undefined && submission.grade !== null) && (
          <View style={{
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: '#10B98115',
            borderWidth: 1,
            borderColor: '#10B98140',
            marginBottom: designTokens.spacing.md,
          }}>
            <Text style={{
              fontSize: designTokens.typography.body.fontSize,
              fontWeight: '600',
              color: '#059669',
              marginBottom: designTokens.spacing.xs,
            }}>
              Overall Grade: {submission.grade}/{homework.points}
            </Text>
            
            {/* Component grades */}
            {submission.text_grade !== undefined && submission.text_grade !== null && (
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: '#059669',
                marginTop: designTokens.spacing.xs,
              }}>
                Text Submission: {submission.text_grade} pts
              </Text>
            )}
            
            {submission.question_grades && submission.question_grades.length > 0 && (
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: '#059669',
                marginTop: designTokens.spacing.xs,
              }}>
                Question Points: {submission.question_grades.reduce((sum, qg) => sum + (qg.grade || 0), 0)} pts
              </Text>
            )}
            
            {submission.feedback && (
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: '#059669',
                marginTop: designTokens.spacing.sm,
              }}>
                Overall Feedback: {submission.feedback}
              </Text>
            )}
            
            <Text style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: '#059669',
              marginTop: designTokens.spacing.xs,
            }}>
              Submitted on: {formatDate(submission.submitted_at)}
            </Text>
            {submission.graded_at && (
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: '#059669',
                marginTop: designTokens.spacing.xs,
              }}>
                Graded on: {formatDate(submission.graded_at)}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const getGradeStatusBadge = (submission: Submission) => {
    if (getGradeStatus(submission) === 'graded') {
      return (
        <View style={{
          paddingHorizontal: designTokens.spacing.md,
          paddingVertical: designTokens.spacing.xs,
          borderRadius: designTokens.borderRadius.full,
          backgroundColor: '#10B98115',
        }}>
          <Text style={{
            fontSize: designTokens.typography.caption1.fontSize,
            fontWeight: '600',
            color: '#10B981',
          }}>
            Graded
          </Text>
        </View>
      );
    } else {
      return (
        <View style={{
          paddingHorizontal: designTokens.spacing.md,
          paddingVertical: designTokens.spacing.xs,
          borderRadius: designTokens.borderRadius.full,
          backgroundColor: '#F59E0B15',
        }}>
          <Text style={{
            fontSize: designTokens.typography.caption1.fontSize,
            fontWeight: '600',
            color: '#F59E0B',
          }}>
            Pending
          </Text>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          marginTop: designTokens.spacing.md,
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
        }}>
          Loading submissions...
        </Text>
      </View>
    );
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
        backgroundColor: colors.backgroundElevated,
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginBottom: designTokens.spacing.lg,
        }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={{
              marginLeft: designTokens.spacing.sm,
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
            }}>
              Back
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{
          fontSize: designTokens.typography.title1.fontSize,
          fontWeight: designTokens.typography.title1.fontWeight,
          color: colors.textPrimary,
          marginBottom: designTokens.spacing.sm,
        } as any}>
          {homework?.title}
        </Text>
        
        <Text style={{
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
          marginBottom: designTokens.spacing.md,
        }}>
          {homework?.class} • {homework?.subject} • {submissions.length} submissions
        </Text>

        {/* Quick Stats */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          gap: designTokens.spacing.sm,
        }}>
          <View style={{
            flex: 1,
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: '#3B82F615',
            borderWidth: 1,
            borderColor: '#3B82F640',
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: '#3B82F6',
              textAlign: 'center',
            } as any}>
              {submissions.length}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: '#3B82F6',
              textAlign: 'center',
            }}>
              Submitted
            </Text>
          </View>
          <View style={{
            flex: 1,
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: '#10B98115',
            borderWidth: 1,
            borderColor: '#10B98140',
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: '#10B981',
              textAlign: 'center',
            } as any}>
              {submissions.filter(s => s.grade !== undefined && s.grade !== null).length}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: '#10B981',
              textAlign: 'center',
            }}>
              Graded
            </Text>
          </View>
          <View style={{
            flex: 1,
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: '#F59E0B15',
            borderWidth: 1,
            borderColor: '#F59E0B40',
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: '#F59E0B',
              textAlign: 'center',
            } as any}>
              {submissions.filter(s => s.grade === undefined || s.grade === null).length}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: '#F59E0B',
              textAlign: 'center',
            }}>
              Pending
            </Text>
          </View>
          <View style={{
            flex: 1,
            padding: designTokens.spacing.md,
            borderRadius: designTokens.borderRadius.lg,
            backgroundColor: '#8B5CF615',
            borderWidth: 1,
            borderColor: '#8B5CF640',
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: '#8B5CF6',
              textAlign: 'center',
            } as any}>
              {calculateAverageGrade()}%
            </Text>
            <Text style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: '#8B5CF6',
              textAlign: 'center',
            }}>
              Avg Grade
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
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ 
          padding: designTokens.spacing.xl,
          paddingTop: designTokens.spacing.lg,
        }}>
          {submissions.length === 0 ? (
            <View style={{
              alignItems: 'center',
              padding: designTokens.spacing.xxl,
              borderRadius: designTokens.borderRadius.xl,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              backgroundColor: colors.backgroundElevated,
            }}>
              <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} style={{ marginBottom: designTokens.spacing.lg }} />
              <Text style={{
                fontSize: designTokens.typography.title2.fontSize,
                fontWeight: designTokens.typography.title2.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.sm,
              } as any}>
                No Submissions Yet
              </Text>
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textSecondary,
                textAlign: 'center',
              }}>
                Students haven't submitted this homework yet
              </Text>
            </View>
          ) : (
            submissions.map((submission) => (
              <View
                key={submission.id}
                style={{
                  borderRadius: designTokens.borderRadius.xl,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundElevated,
                  padding: designTokens.spacing.lg,
                  marginBottom: designTokens.spacing.md,
                  ...designTokens.shadows.sm,
                }}
              >
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: designTokens.spacing.md,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: designTokens.typography.headline.fontSize,
                      fontWeight: designTokens.typography.headline.fontWeight,
                      color: colors.textPrimary,
                      marginBottom: designTokens.spacing.xs,
                    } as any}>
                      {submission.student?.profile?.name || 'Student'}
                    </Text>
                    <Text style={{
                      fontSize: designTokens.typography.caption1.fontSize,
                      color: colors.textSecondary,
                    }}>
                      {submission.student?.profile?.class && `${submission.student.profile.class} • `}
                      Submitted {formatDate(submission.submitted_at)}
                    </Text>
                  </View>
                  {getGradeStatusBadge(submission)}
                </View>

                {/* Grade Display */}
                {getGradeStatus(submission) === 'graded' && (
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.lg,
                    backgroundColor: '#10B98115',
                    borderWidth: 1,
                    borderColor: '#10B98140',
                    marginBottom: designTokens.spacing.md,
                  }}>
                    <View>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        fontWeight: '600',
                        color: '#10B981',
                      }}>
                        Overall Grade: {submission.grade}/{homework?.points}
                      </Text>
                      {submission.question_grades && submission.question_grades.some(qg => qg.grade !== null) && (
                        <Text style={{
                          fontSize: designTokens.typography.caption1.fontSize,
                          color: '#10B981',
                          marginTop: designTokens.spacing.xs,
                        }}>
                          Question Grades: {submission.question_grades.filter(qg => qg.grade !== null).length} graded
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Use the new render function */}
                {renderSubmissionDetails(submission)}

                <TouchableOpacity
                  onPress={() => openGradeModal(submission)}
                  style={{
                    paddingVertical: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.lg,
                    backgroundColor: getGradeStatus(submission) === 'graded' 
                      ? colors.background 
                      : colors.primary,
                    borderWidth: 1,
                    borderColor: getGradeStatus(submission) === 'graded' 
                      ? colors.border 
                      : colors.primary,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: getGradeStatus(submission) === 'graded' 
                      ? colors.textPrimary 
                      : 'white',
                  }}>
                    {getGradeStatus(submission) === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Grading Modal */}
      <Modal
        visible={!!gradingSubmission}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setGradingSubmission(null)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ 
            paddingHorizontal: designTokens.spacing.xl,
            paddingTop: designTokens.spacing.xxl,
            paddingBottom: designTokens.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.backgroundElevated,
          }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: designTokens.spacing.lg,
            }}>
              <Text style={{
                fontSize: designTokens.typography.title2.fontSize,
                fontWeight: designTokens.typography.title2.fontWeight,
                color: colors.textPrimary,
              } as any}>
                Grade Submission
              </Text>
              <TouchableOpacity 
                onPress={() => setGradingSubmission(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? '#374151' : '#E5E7EB',
                }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{
              fontSize: designTokens.typography.headline.fontSize,
              color: colors.textSecondary,
            } as any}>
              {gradingSubmission?.student?.profile?.name}
            </Text>
            {gradingSubmission && (
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textSecondary,
                marginTop: designTokens.spacing.xs,
              }}>
                Submitted on {formatDate(gradingSubmission.submitted_at)}
              </Text>
            )}
          </View>

          <ScrollView style={{ flex: 1 }}>
            <View style={{ 
              padding: designTokens.spacing.xl,
              paddingBottom: designTokens.spacing.xxxl,
            }}>
              {/* Submission Content Preview */}
              {gradingSubmission?.content && (
                <View style={{ marginBottom: designTokens.spacing.xl }}>
                  <Text style={{
                    fontSize: designTokens.typography.title3.fontSize,
                    fontWeight: designTokens.typography.title3.fontWeight,
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.md,
                  } as any}>
                    Student's Submission Content
                  </Text>
                  <View style={{
                    padding: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElevated,
                  }}>
                    <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                    }}>
                      {gradingSubmission.content}
                    </Text>
                  </View>
                </View>
              )}

              {/* Questions and Answers Preview with Grading */}
              {homework?.allow_questions && homework.questions && homework.questions.length > 0 && (
                <View style={{ marginBottom: designTokens.spacing.xl }}>
                  <Text style={{
                    fontSize: designTokens.typography.title3.fontSize,
                    fontWeight: designTokens.typography.title3.fontWeight,
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.md,
                  } as any}>
                    Questions & Answers
                  </Text>
                  {homework.questions.map((question, index) => {
                    const answer = gradingSubmission?.answers?.find(a => a.question_id === question.id);
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
                          marginBottom: designTokens.spacing.md,
                        }}
                      >
                        <Text style={{
                          fontSize: designTokens.typography.body.fontSize,
                          fontWeight: '600',
                          color: colors.textPrimary,
                          marginBottom: designTokens.spacing.xs,
                        }}>
                          {index + 1}. {question.text} ({question.points} pts)
                        </Text>
                        
                        {question.type === 'multiple_choice' && question.options && (
                          <View style={{ marginBottom: designTokens.spacing.xs }}>
                            {question.options.map((option, optionIndex) => (
                              <Text key={optionIndex} style={{
                                fontSize: designTokens.typography.caption1.fontSize,
                                color: colors.textSecondary,
                                marginLeft: designTokens.spacing.md,
                              }}>
                                {String.fromCharCode(65 + optionIndex)}. {option}
                              </Text>
                            ))}
                          </View>
                        )}
                        
                        <Text style={{
                          fontSize: designTokens.typography.body.fontSize,
                          color: colors.textSecondary,
                          marginBottom: designTokens.spacing.md,
                        }}>
                          Answer: {answer ? answer.answer : 'No answer provided'}
                        </Text>
                        
                        {/* Question Grade Input */}
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center',
                          marginBottom: designTokens.spacing.sm,
                        }}>
                          <Text style={{
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textPrimary,
                            marginRight: designTokens.spacing.sm,
                            width: 80,
                          }}>
                            Grade:
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
                            }}
                            placeholder={`0-${question.points}`}
                            keyboardType="numeric"
                            value={currentGrade}
                            onChangeText={(text) => {
                              const numericValue = text.replace(/[^0-9]/g, '');
                              if (numericValue === '' || parseInt(numericValue) <= question.points) {
                                setQuestionGrades(prev => ({
                                  ...prev,
                                  [question.id]: {
                                    ...prev[question.id],
                                    grade: numericValue
                                  }
                                }));
                              }
                            }}
                          />
                          <Text style={{
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textPrimary,
                            marginLeft: designTokens.spacing.xs,
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
                          }}>
                            Feedback:
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
                            }}
                            placeholder="Add feedback for this question..."
                            value={currentFeedback}
                            onChangeText={(text) => {
                              setQuestionGrades(prev => ({
                                ...prev,
                                [question.id]: {
                                  ...prev[question.id],
                                  feedback: text
                                }
                              }));
                            }}
                            multiline
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Text Submission Grade */}
              <View style={{ marginBottom: designTokens.spacing.xl }}>
                <Text style={{
                  fontSize: designTokens.typography.title3.fontSize,
                  fontWeight: designTokens.typography.title3.fontWeight,
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.md,
                } as any}>
                  Text Submission Grade
                </Text>
                
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                }}>
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textPrimary,
                    marginRight: designTokens.spacing.sm,
                    width: 80,
                  }}>
                    Grade:
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
                    }}
                  />
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textPrimary,
                    marginLeft: designTokens.spacing.xs,
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
                } as any}>
                  Overall Feedback
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
                  }}
                  placeholder="Add your overall feedback for the student..."
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline
                />
              </View>

              {/* Action Buttons */}
              <View style={{ 
                flexDirection: 'row', 
                gap: designTokens.spacing.md,
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
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: colors.textPrimary,
                  }}>
                    Cancel
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
                    alignItems: 'center',
                  }}
                >
                  {grading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      fontWeight: '600',
                      color: 'white',
                    }}>
                      Save Grade
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
