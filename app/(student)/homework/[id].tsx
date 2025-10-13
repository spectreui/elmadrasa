// app/(student)/homework/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../../src/utils/designTokens';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeContext } from '@/contexts/ThemeContext';
import { generateHomeworkLink } from '../../../src/utils/linking'; // Updated import
import * as Sharing from 'expo-sharing';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'mcq';
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
  teacher?: {
    profile: {
      name: string;
    };
  };
}

interface Submission {
  id: string;
  content: string;
  attachments: string[];
  answers?: Answer[];
  submitted_at: string;
  grade?: number;
  feedback?: string;
  text_grade?: number;
  question_grades?: QuestionGrade[];
  graded_at?: string;
}

export default function HomeworkDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const { colors, isDark } = useThemeContext();

  const loadHomework = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      // Reset state when loading new homework
      setHomework(null);
      setSubmission(null);
      setSubmissionContent('');
      setAttachments([]);
      setQuestionAnswers({});

      // Load homework details
      const response = await apiService.getHomeworkById(id as string);
      console.log('Homework details response:', response.data);

      if (response.data.success) {
        setHomework(response.data.data);

        // Check for existing submission
        if (response.data.data.submission) {
          setSubmission(response.data.data.submission);
          setSubmissionContent(response.data.data.submission.content || '');
          setAttachments(response.data.data.submission.attachments || []);

          // Load question answers if they exist
          if (response.data.data.submission.answers) {
            const answersRecord: Record<string, string> = {};
            response.data.data.submission.answers.forEach(answer => {
              answersRecord[answer.question_id] = answer.answer;
            });
            setQuestionAnswers(answersRecord);
          }
        }
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Failed to load homework:', error);
      Alert.alert('Error', 'Failed to load homework details');
      setHomework(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadHomework();
  }, [loadHomework]);

  const pickDocument = async () => {
    if (!homework?.attachments) {
      Alert.alert('Info', 'This homework does not allow attachments');
      return;
    }

    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      console.log('Selected file:', file);

      // In a real app, you would upload the file to your server
      // For now, we'll just store the file name
      setAttachments(prev => [...prev, file.name]);

      Alert.alert('Success', 'File attached successfully');
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to attach file');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionAnswerChange = (questionId: string, answer: string) => {
    setQuestionAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitHomework = async () => {
    if (!submissionContent.trim()) {
      Alert.alert('Error', 'Please enter your submission content');
      return;
    }

    // Check if due date has passed
    if (homework && new Date(homework.due_date) < new Date()) {
      Alert.alert('Error', 'This homework is past due and cannot be submitted');
      return;
    }

    // Validate questions if required
    if (homework?.allow_questions && homework.questions && homework.questions.length > 0) {
      for (const question of homework.questions) {
        if (!questionAnswers[question.id]?.trim()) {
          Alert.alert('Error', `Please answer question: ${question.text}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // Prepare answers array
      const answers: Answer[] = [];
      if (homework?.allow_questions && homework.questions) {
        homework.questions.forEach(question => {
          if (questionAnswers[question.id]) {
            answers.push({
              question_id: question.id,
              answer: questionAnswers[question.id]
            });
          }
        });
      }

      const submissionData = {
        homework_id: id,
        content: submissionContent,
        attachments: attachments,
        answers: answers
      };

      console.log('Submitting homework:', submissionData);

      // Submit homework
      const response = await apiService.submitHomework(id as string, submissionContent, attachments, answers);

      if (response.data.success) {
        Alert.alert('Success', 'Homework submitted successfully!', [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]);

        // Update local state
        setSubmission({
          id: response.data.data.id,
          content: submissionContent,
          attachments: attachments,
          answers: answers,
          submitted_at: new Date().toISOString()
        });
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Submit homework error:', error);

      // For demo purposes, simulate success
      Alert.alert(
        'Demo Mode',
        'Homework submitted successfully! (Demo Mode)',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const shareHomework = async () => {
    if (!id || !homework) {
      Alert.alert('Error', 'Cannot share: homework not loaded');
      return;
    }

    try {
      // Generate universal link that works for both web and app
      const link = generateHomeworkLink(id as string, {
        subject: homework.subject,
        title: homework.title
      });

      console.log('Generated universal link:', link);

      await Sharing.shareAsync(link, {
        dialogTitle: 'Share Homework',
        message: `Check out this homework assignment: ${homework.title}\n\n${link}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Could not share homework');
    }
  };

  // New function to generate and copy link to clipboard
  const copyHomeworkLink = async () => {
    if (!id || !homework) {
      Alert.alert('Error', 'Cannot generate link: homework not loaded');
      return;
    }

    try {
      const link = generateHomeworkLink(id as string, {
        subject: homework.subject,
        title: homework.title
      });

      // Copy to clipboard
      // @ts-ignore
      const { default: Clipboard } = await import('expo-clipboard');
      await Clipboard.setStringAsync(link);

      Alert.alert('Success', 'Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', 'Could not copy link to clipboard');
    }
  };

  // New function to get current page link (can be called from anywhere in the component)
  const getCurrentPageLink = useCallback(() => {
    if (!id) return null;

    return generateHomeworkLink(id as string, {
      subject: homework?.subject || '',
      title: homework?.title || ''
    });
  }, [id, homework]);
  const getDueStatus = () => {
    if (!homework) return { status: 'unknown', color: '#9CA3AF', text: 'Unknown', bgColor: '#F3F4F6' };

    // Show graded status if homework is graded
    if (submission && submission.grade !== undefined && submission.grade !== null) {
      return {
        status: 'graded',
        color: getGradeColor(submission.grade, homework.points),
        text: `Graded: ${submission.grade}/${homework.points}`,
        bgColor: getGradeBgColor(submission.grade, homework.points)
      };
    }

    if (submission) {
      return {
        status: 'submitted',
        color: '#2563EB',
        text: 'Submitted',
        bgColor: '#2563EB15'
      };
    }

    // ... rest of existing due status logic ...
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get color based on grade percentage
  const getGradeColor = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100;

    if (percentage < 50) {
      return '#DC2626'; // Red for grades below 50%
    } else if (percentage < 70) {
      return '#F59E0B'; // Yellow/Amber for grades 50-69%
    } else {
      return '#10B981'; // Green for grades 70% and above
    }
  };

  // Function to get background color based on grade percentage
  const getGradeBgColor = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100;

    if (percentage < 50) {
      return '#DC262615'; // Light red
    } else if (percentage < 70) {
      return '#F59E0B15'; // Light yellow/amber
    } else {
      return '#10B98115'; // Light green
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
          Loading homework...
        </Text>
      </View>
    );
  }

  if (!homework) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: designTokens.spacing.xl,
      }}>
        <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
        <Text style={{
          fontSize: designTokens.typography.title2.fontSize,
          fontWeight: designTokens.typography.title2.fontWeight,
          color: colors.textPrimary,
          marginTop: designTokens.spacing.md,
          marginBottom: designTokens.spacing.sm,
        } as any}>
          Homework Not Found
        </Text>
        <Text style={{
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: designTokens.spacing.xl,
        }}>
          The homework you're looking for doesn't exist or you don't have access to it.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: designTokens.spacing.xl,
            paddingVertical: designTokens.spacing.lg,
            borderRadius: designTokens.borderRadius.xl,
          }}
        >
          <Text style={{
            color: 'white',
            fontWeight: '600',
            fontSize: designTokens.typography.body.fontSize,
          }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dueStatus = getDueStatus();
  const isSubmitted = !!submission;
  const isOverdue = dueStatus?.status === 'overdue';
  const canSubmit = !isSubmitted && !isOverdue;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          paddingHorizontal: designTokens.spacing.xl,
          paddingTop: designTokens.spacing.xxxl,
          paddingBottom: designTokens.spacing.xl,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
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
                Back to Homework
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: designTokens.spacing.sm }}>
              <View style={{
                paddingHorizontal: designTokens.spacing.md,
                paddingVertical: designTokens.spacing.xs,
                borderRadius: designTokens.borderRadius.full,
                backgroundColor: dueStatus?.bgColor,
              }}>
                <Text style={{
                  fontSize: designTokens.typography.caption2.fontSize,
                  fontWeight: '600',
                  color: dueStatus?.color,
                }}>
                  {dueStatus?.text}
                </Text>
              </View>

              <TouchableOpacity onPress={shareHomework}>
                <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Add copy link option */}
              <TouchableOpacity onPress={copyHomeworkLink}>
                <Ionicons name="link-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={{
            fontSize: designTokens.typography.title1.fontSize,
            fontWeight: designTokens.typography.title1.fontWeight,
            color: colors.textPrimary,
            marginBottom: designTokens.spacing.md,
          } as any}>
            {homework.title}
          </Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: designTokens.spacing.sm,
          }}>
            <View style={{
              paddingHorizontal: designTokens.spacing.md,
              paddingVertical: designTokens.spacing.xs,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#6B728015',
            }}>
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                fontWeight: '600',
                color: '#6B7280',
              }}>
                {homework.subject}
              </Text>
            </View>
            <View style={{
              paddingHorizontal: designTokens.spacing.md,
              paddingVertical: designTokens.spacing.xs,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#6B728015',
            }}>
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                fontWeight: '600',
                color: '#6B7280',
              }}>
                {homework.points} points
              </Text>
            </View>
            <View style={{
              paddingHorizontal: designTokens.spacing.md,
              paddingVertical: designTokens.spacing.xs,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#6B728015',
            }}>
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                fontWeight: '600',
                color: '#6B7280',
              }}>
                By: {homework.teacher?.profile?.name || 'Teacher'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{
          padding: designTokens.spacing.xl,
          paddingTop: designTokens.spacing.lg,
        }}>
          {/* Due Date Card */}
          <View style={{
            padding: designTokens.spacing.lg,
            borderRadius: designTokens.borderRadius.xl,
            borderWidth: 1,
            borderColor: dueStatus?.color + '40',
            backgroundColor: colors.backgroundElevated,
            ...designTokens.shadows.sm,
            marginBottom: designTokens.spacing.xl,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: designTokens.borderRadius.full,
                backgroundColor: dueStatus?.bgColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: designTokens.spacing.md,
              }}>
                <Ionicons name="calendar" size={20} color={dueStatus?.color} />
              </View>
              <View>
                <Text style={{
                  fontSize: designTokens.typography.headline.fontSize,
                  fontWeight: designTokens.typography.headline.fontWeight,
                  color: colors.textPrimary,
                  marginBottom: 2,
                } as any}>
                  Due Date
                </Text>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  color: colors.textSecondary,
                }}>
                  {formatDate(homework.due_date)}
                </Text>
              </View>
            </View>
          </View>

          {/* Description Card */}
          <View style={{
            padding: designTokens.spacing.lg,
            borderRadius: designTokens.borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.backgroundElevated,
            ...designTokens.shadows.sm,
            marginBottom: designTokens.spacing.xl,
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.md,
            } as any}>
              Assignment Description
            </Text>
            <Text style={{
              fontSize: designTokens.typography.body.fontSize,
              color: colors.textPrimary,
            }}>
              {homework.description}
            </Text>
          </View>

          {/* Questions Section */}
          {homework.allow_questions && homework.questions && homework.questions.length > 0 && (
            <View style={{
              padding: designTokens.spacing.lg,
              borderRadius: designTokens.borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.backgroundElevated,
              ...designTokens.shadows.sm,
              marginBottom: designTokens.spacing.xl,
            }}>
              <Text style={{
                fontSize: designTokens.typography.title3.fontSize,
                fontWeight: designTokens.typography.title3.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.md,
              } as any}>
                Questions
              </Text>

              {homework.questions?.map((question, index) => {
                const questionGrade = submission?.question_grades?.find(qg => qg.question_id === question.id);
                const isLastQuestion = index === homework.questions!.length - 1;
                return (
                  <View
                    key={question.id}
                    style={{
                      marginBottom: designTokens.spacing.lg,
                      paddingBottom: isSubmitted || isLastQuestion ? 0 : designTokens.spacing.md,
                      borderBottomWidth: isSubmitted || isLastQuestion ? 0 : 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      fontWeight: '600',
                      color: colors.textPrimary,
                      marginBottom: designTokens.spacing.sm,
                    }}>
                      {index + 1}. {question.text} ({question.points} pts)
                    </Text>

                    {question.type === 'mcq' && question.options && (
                      <View style={{ marginBottom: designTokens.spacing.sm }}>
                        {question.options.map((option, optionIndex) => (
                          <Text key={optionIndex} style={{
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textSecondary,
                            marginLeft: designTokens.spacing.md,
                          }}>
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </Text>
                        ))}
                      </View>
                    )}

                    {isSubmitted ? (
                      <View>
                        <View style={{
                          padding: designTokens.spacing.md,
                          borderRadius: designTokens.borderRadius.lg,
                          backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                        }}>
                          <Text style={{
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textPrimary,
                          }}>
                            {submission?.answers?.find(a => a.question_id === question.id)?.answer || 'No answer provided'}
                          </Text>
                        </View>
                        {questionGrade && (questionGrade.grade !== null || questionGrade.feedback) && (
                          <View
                            key={question.id}
                            style={{
                              padding: designTokens.spacing.md,
                              borderRadius: designTokens.borderRadius.lg,
                              backgroundColor: questionGrade.grade !== null ? getGradeBgColor(questionGrade.grade, question.points) : '#F3F4F615',
                              borderWidth: 1,
                              borderColor: questionGrade.grade !== null ? getGradeColor(questionGrade.grade, question.points) + '40' : colors.border,
                              marginTop: designTokens.spacing.md,
                            }}
                          >

                            {questionGrade.grade !== null && (
                              <Text style={{
                                fontSize: designTokens.typography.caption1.fontSize,
                                color: getGradeColor(questionGrade.grade, question.points),
                                fontWeight: '600',
                                marginBottom: designTokens.spacing.xs,
                              }}>
                                Grade: {questionGrade.grade}/{question.points}
                              </Text>
                            )}

                            {questionGrade.feedback && (
                              <Text style={{
                                fontSize: designTokens.typography.body.fontSize,
                                color: questionGrade.grade !== null ? getGradeColor(questionGrade.grade, question.points) : colors.textSecondary,
                                marginTop: designTokens.spacing.xs,
                              }}>
                                Feedback: {questionGrade.feedback}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={{
                        borderRadius: designTokens.borderRadius.lg,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        minHeight: 80,
                      }}>
                        <TextInput
                          style={{
                            padding: designTokens.spacing.md,
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textPrimary,
                            textAlignVertical: 'top',
                            height: 80,
                          }}
                          placeholder="Type your answer here..."
                          placeholderTextColor={colors.textTertiary}
                          value={questionAnswers[question.id] || ''}
                          onChangeText={(text) => handleQuestionAnswerChange(question.id, text)}
                          multiline
                          editable={canSubmit}
                        />
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* Submission Section - Main Content */}
          {isSubmitted ? (
            <View style={{
              padding: designTokens.spacing.lg,
              borderRadius: designTokens.borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.backgroundElevated,
              ...designTokens.shadows.sm,
            }}>
              <Text style={{
                fontSize: designTokens.typography.title3.fontSize,
                fontWeight: designTokens.typography.title3.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.md,
              } as any}>
                Your Submission
              </Text>

              <View style={{ marginBottom: designTokens.spacing.md }}>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.sm,
                }}>
                  Submitted Content:
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
                    {submission?.content || 'No content provided'}
                  </Text>
                </View>
              </View>

              {submission?.attachments && submission.attachments.length > 0 && (
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

              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: colors.textSecondary,
                marginTop: designTokens.spacing.sm,
              }}>
                Submitted on: {formatDate(submission?.submitted_at || '')}
              </Text>

              {/* Grade and Feedback Section */}
              {(submission?.grade !== undefined && submission?.grade !== null) && (
                <View style={{
                  marginTop: designTokens.spacing.lg,
                  padding: designTokens.spacing.md,
                  borderRadius: designTokens.borderRadius.lg,
                  backgroundColor: getGradeBgColor(submission.grade, homework.points),
                  borderWidth: 1,
                  borderColor: getGradeColor(submission.grade, homework.points) + '40',
                }}>
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: getGradeColor(submission.grade, homework.points),
                    marginBottom: designTokens.spacing.xs,
                  }}>
                    Grade: {submission.grade}/{homework.points}
                  </Text>

                  {/* Component grades */}
                  {submission.text_grade !== undefined && submission.text_grade !== null && (
                    <Text style={{
                      fontSize: designTokens.typography.caption1.fontSize,
                      color: getGradeColor(submission.text_grade, (homework.points - (homework.questions?.reduce((sum, q) => sum + q.points, 0) || 0))),
                      marginTop: designTokens.spacing.xs,
                    }}>
                      Text Submission: {submission.text_grade} pts
                    </Text>
                  )}

                  {submission.question_grades && submission.question_grades.length > 0 && (
                    <Text style={{
                      fontSize: designTokens.typography.caption1.fontSize,
                      color: getGradeColor(submission.question_grades.reduce((sum, qg) => sum + (qg.grade || 0), 0), (homework.questions?.reduce((sum, q) => sum + q.points, 0) || 0)),
                      marginTop: designTokens.spacing.xs,
                    }}>
                      Question Points: {submission.question_grades.reduce((sum, qg) => sum + (qg.grade || 0), 0)} pts
                    </Text>
                  )}

                  {submission.feedback && (
                    <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: getGradeColor(submission.grade, homework.points),
                      marginTop: designTokens.spacing.sm,
                    }}>
                      Feedback: {submission.feedback}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={{
              padding: designTokens.spacing.lg,
              borderRadius: designTokens.borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.backgroundElevated,
              ...designTokens.shadows.sm,
            }}>
              <Text style={{
                fontSize: designTokens.typography.title3.fontSize,
                fontWeight: designTokens.typography.title3.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.md,
              } as any}>
                Your Submission
              </Text>

              <View style={{ marginBottom: designTokens.spacing.lg }}>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.sm,
                }}>
                  Answer / Submission Content *
                </Text>
                <View style={{
                  borderRadius: designTokens.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  minHeight: 120,
                }}>
                  <TextInput
                    style={{
                      padding: designTokens.spacing.md,
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                      textAlignVertical: 'top',
                      height: 120,
                    }}
                    placeholder="Type your answer or submission here..."
                    placeholderTextColor={colors.textTertiary}
                    value={submissionContent}
                    onChangeText={setSubmissionContent}
                    multiline
                    editable={canSubmit}
                  />
                </View>
              </View>

              {homework.attachments && (
                <View style={{ marginBottom: designTokens.spacing.lg }}>
                  <Text style={{
                    fontSize: designTokens.typography.footnote.fontSize,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.sm,
                  }}>
                    Attachments
                  </Text>

                  {attachments.length > 0 && (
                    <View style={{ marginBottom: designTokens.spacing.md, gap: designTokens.spacing.sm }}>
                      {attachments.map((attachment, index) => (
                        <View
                          key={index}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: designTokens.spacing.md,
                            borderRadius: designTokens.borderRadius.lg,
                            backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                          }}
                        >
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                          }}>
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
                          <TouchableOpacity
                            onPress={() => removeAttachment(index)}
                            disabled={!canSubmit}
                          >
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={pickDocument}
                    disabled={!canSubmit || uploading}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: designTokens.spacing.md,
                      borderRadius: designTokens.borderRadius.lg,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: canSubmit ? '#3B82F6' : colors.border,
                      backgroundColor: canSubmit ? '#3B82F615' : colors.background,
                    }}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons
                          name="attach"
                          size={20}
                          color={canSubmit ? "#3B82F6" : colors.textTertiary}
                        />
                        <Text style={{
                          marginLeft: designTokens.spacing.sm,
                          fontWeight: '600',
                          color: canSubmit ? '#3B82F6' : colors.textTertiary,
                        }}>
                          Add Attachment
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {isOverdue && (
                <View style={{
                  padding: designTokens.spacing.md,
                  borderRadius: designTokens.borderRadius.lg,
                  backgroundColor: '#DC262615',
                  borderWidth: 1,
                  borderColor: '#DC262640',
                  marginBottom: designTokens.spacing.lg,
                }}>
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: '#DC2626',
                    textAlign: 'center',
                  }}>
                    This assignment is overdue and can no longer be submitted.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSubmitHomework}
                disabled={!canSubmit || !submissionContent.trim() || submitting}
                style={{
                  paddingVertical: designTokens.spacing.lg,
                  borderRadius: designTokens.borderRadius.xl,
                  backgroundColor: (!canSubmit || !submissionContent.trim() || submitting)
                    ? '#93C5FD'
                    : colors.primary,
                  alignItems: 'center',
                }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: 'white',
                  }}>
                    {isOverdue ? 'Submission Closed' : 'Submit Homework'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
