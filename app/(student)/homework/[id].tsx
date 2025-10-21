// app/(student)/homework/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import Alert from '@/components/Alert';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../../src/utils/designTokens';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeContext } from '@/contexts/ThemeContext';
import { generateHomeworkLink } from '../../../src/utils/linking';
import { ShareModal } from '@/components/ShareModal';
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t, isRTL } = useTranslation();
  const { id } = useLocalSearchParams();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const { fontFamily, colors, isDark } = useThemeContext();
  const [showShareModal, setShowShareModal] = useState(false);

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
            response.data.data.submission.answers.forEach((answer: any) => {
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
      Alert.alert(t('common.error'), t('homework.loadDetailsFailed'));
      setHomework(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadHomework();
  }, [loadHomework]);

  const pickDocument = async () => {
    if (!homework?.attachments) {
      Alert.alert(t('common.info'), t('homework.noAttachmentsAllowed'));
      return;
    }

    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const file = result.assets[0];
      console.log('Selected file:', file);

      // In a real app, you would upload the file to your server
      // For now, we'll just store the file name
      setAttachments((prev) => [...prev, file.name]);

      Alert.alert(t('common.success'), t('homework.fileAttached'));
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert(t('common.error'), t('homework.attachFileFailed'));
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionAnswerChange = (questionId: string, answer: string) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitHomework = async () => {
    if (!submissionContent.trim()) {
      Alert.alert(t('common.error'), t('homework.enterSubmission'));
      return;
    }

    // Check if due date has passed
    if (homework && new Date(homework.due_date) < new Date()) {
      Alert.alert(t('common.error'), t('homework.pastDue'));
      return;
    }

    // Validate questions if required
    if (homework?.allow_questions && homework.questions && homework.questions.length > 0) {
      for (const question of homework.questions) {
        if (!questionAnswers[question.id]?.trim()) {
          Alert.alert(t('common.error'), `${t('homework.pleaseAnswer')}: ${question.text}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // Prepare answers array
      const answers: Answer[] = [];
      if (homework?.allow_questions && homework.questions) {
        homework.questions.forEach((question) => {
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
        Alert.alert(t('common.success'), t('homework.submittedSuccessfully'), [
          {
            text: t('common.ok'),
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
        t('homework.demoMode'),
        t('homework.submittedDemo'),
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  // New function to generate and copy link to clipboard
  const copyHomeworkLink = async () => {
    if (!id || !homework) {
      Alert.alert(t('common.error'), t('homework.cannotGenerateLink'));
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

      Alert.alert(t('common.success'), t('homework.linkCopied'));
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert(t('common.error'), t('homework.copyLinkFailed'));
    }
  };

  const getDueStatus = () => {
    if (!homework) return { status: 'unknown', color: '#9CA3AF', text: t('common.unknown'), bgColor: '#F3F4F6' };

    // Show graded status if homework is graded
    if (submission && submission.grade !== undefined && submission.grade !== null) {
      return {
        status: 'graded',
        color: getGradeColor(submission.grade, homework.points),
        text: `${t('homework.graded')}: ${submission.grade}/${homework.points}`,
        bgColor: getGradeBgColor(submission.grade, homework.points)
      };
    }

    if (submission) {
      return {
        status: 'submitted',
        color: '#2563EB',
        text: t('homework.submitted'),
        bgColor: '#2563EB15'
      };
    }

    const now = new Date();
    const dueDate = new Date(homework.due_date);
    
    if (dueDate < now) {
      return {
        status: 'overdue',
        color: '#DC2626',
        text: t('homework.overdue'),
        bgColor: '#DC262615'
      };
    }

    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return {
        status: 'dueSoon',
        color: '#F59E0B',
        text: t('homework.dueSoon'),
        bgColor: '#F59E0B15'
      };
    }

    return {
      status: 'pending',
      color: '#10B981',
      text: t('homework.pending'),
      bgColor: '#10B98115'
    };
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
    const percentage = grade / maxPoints * 100;

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
    const percentage = grade / maxPoints * 100;

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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontFamily, color: colors.textSecondary }]}>
          {t('homework.loading')}
        </Text>
      </View>
    );
  }

  if (!homework) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.errorTitle, { fontFamily, color: colors.textPrimary }]}>
          {t('homework.notFound')}
        </Text>
        <Text style={[styles.errorSubtitle, { fontFamily, color: colors.textSecondary }]}>
          {t('homework.notExist')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.backButtonText, { fontFamily }]}>
            {t('common.goBack')}
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
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { 
          backgroundColor: colors.background,
          borderBottomColor: colors.border
        }]}>
          <View style={[styles.headerRow, isRTL && styles.rtlRow]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButtonContainer}>
              <Ionicons 
                name={isRTL ? "arrow-forward" : "arrow-back"} 
                size={20} 
                color={colors.textSecondary} 
              />
              <Text style={[styles.backButtonText, { fontFamily, color: colors.textSecondary }]}>
                {t('homework.backToHomework')}
              </Text>
            </TouchableOpacity>

            <View style={[styles.headerActions, isRTL && styles.rtlRow]}>
              <View style={[styles.statusBadge, { backgroundColor: dueStatus?.bgColor }]}>
                <Text style={[styles.statusText, { fontFamily, color: dueStatus?.color }]}>
                  {dueStatus?.text}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setShowShareModal(true)}>
                <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Add copy link option */}
              <TouchableOpacity onPress={copyHomeworkLink}>
                <Ionicons name="link-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.title, { fontFamily, color: colors.textPrimary }]}>
            {homework.title}
          </Text>

          <View style={[styles.tagsContainer, isRTL && styles.rtlRow]}>
            <View style={[styles.tag, { backgroundColor: '#6B728015' }]}>
              <Text style={[styles.tagText, { fontFamily, color: '#6B7280' }]}>
                {homework.subject}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#6B728015' }]}>
              <Text style={[styles.tagText, { fontFamily, color: '#6B7280' }]}>
                {homework.points} {t('common.points')}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#6B728015' }]}>
              <Text style={[styles.tagText, { fontFamily, color: '#6B7280' }]}>
                {t('homework.by')}: {homework.teacher?.profile?.name || t('common.teacher')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Due Date Card */}
          <View style={[styles.card, { 
            backgroundColor: colors.backgroundElevated,
            borderColor: dueStatus?.color + '40',
            ...designTokens.shadows.sm
          }]}>
            <View style={[styles.cardRow, isRTL && styles.rtlRow]}>
              <View style={[styles.iconContainer, { backgroundColor: dueStatus?.bgColor }]}>
                <Ionicons name="calendar" size={20} color={dueStatus?.color} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                  {t('homework.dueDate')}
                </Text>
                <Text style={[styles.cardSubtitle, { fontFamily, color: colors.textSecondary }]}>
                  {formatDate(homework.due_date)}
                </Text>
              </View>
            </View>
          </View>

          {/* Description Card */}
          <View style={[styles.card, { 
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.border,
            ...designTokens.shadows.sm
          }]}>
            <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary }]}>
              {t('homework.assignmentDescription')}
            </Text>
            <Text style={[styles.description, { fontFamily, color: colors.textPrimary }]}>
              {homework.description}
            </Text>
          </View>

          {/* Questions Section */}
          {homework.allow_questions && homework.questions && homework.questions.length > 0 && (
            <View style={[styles.card, { 
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.border,
              ...designTokens.shadows.sm
            }]}>
              <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary }]}>
                {t('homework.questions')}
              </Text>

              {homework.questions?.map((question, index) => {
                const questionGrade = submission?.question_grades?.find((qg) => qg.question_id === question.id);
                const isLastQuestion = index === homework.questions!.length - 1;
                return (
                  <View
                    key={question.id}
                    style={[styles.questionContainer, {
                      borderBottomColor: colors.border,
                      paddingBottom: isSubmitted || isLastQuestion ? 0 : designTokens.spacing.md,
                      marginBottom: designTokens.spacing.lg
                    }]}>
                    <Text style={[styles.questionText, { fontFamily, color: colors.textPrimary }]}>
                      {index + 1}. {question.text} ({question.points} {t('common.points')})
                    </Text>

                    {question.type === 'mcq' && question.options && (
                      <View style={styles.optionsContainer}>
                        {question.options.map((option, optionIndex) => (
                          <Text 
                            key={optionIndex} 
                            style={[styles.optionText, { fontFamily, color: colors.textSecondary }]}>
                            {String.fromCharCode(65 + optionIndex)}. {option}
                          </Text>
                        ))}
                      </View>
                    )}

                    {isSubmitted ? (
                      <View>
                        <View style={[styles.submissionContent, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
                          <Text style={[styles.submissionText, { fontFamily, color: colors.textPrimary }]}>
                            {submission?.answers?.find((a) => a.question_id === question.id)?.answer || t('submissions.noAnswer')}
                          </Text>
                        </View>
                        {questionGrade && (questionGrade.grade !== null || questionGrade.feedback) && (
                          <View
                            style={[styles.gradeContainer, {
                              backgroundColor: questionGrade.grade !== null ? getGradeBgColor(questionGrade.grade, question.points) : '#F3F4F615',
                              borderColor: questionGrade.grade !== null ? getGradeColor(questionGrade.grade, question.points) + '40' : colors.border
                            }]}>
                            {questionGrade.grade !== null && (
                              <Text style={[styles.gradeText, { 
                                fontFamily, 
                                color: getGradeColor(questionGrade.grade, question.points) 
                              }]}>
                                {t('homework.grade')}: {questionGrade.grade}/{question.points}
                              </Text>
                            )}
                            {questionGrade.feedback && (
                              <Text style={[styles.feedbackText, { 
                                fontFamily, 
                                color: questionGrade.grade !== null ? getGradeColor(questionGrade.grade, question.points) : colors.textSecondary 
                              }]}>
                                {t('homework.feedback')}: {questionGrade.feedback}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={[styles.answerInput, { 
                        borderColor: colors.border,
                        backgroundColor: colors.background 
                      }]}>
                        <TextInput
                          style={[styles.textInput, { 
                            fontFamily, 
                            color: colors.textPrimary 
                          }]}
                          placeholder={t('homework.typeAnswer')}
                          placeholderTextColor={colors.textTertiary}
                          value={questionAnswers[question.id] || ''}
                          onChangeText={(text) => handleQuestionAnswerChange(question.id, text)}
                          multiline
                          editable={canSubmit}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Submission Section - Main Content */}
          {isSubmitted ? (
            <View style={[styles.card, { 
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.border,
              ...designTokens.shadows.sm
            }]}>
              <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary }]}>
                {t('homework.yourSubmission')}
              </Text>

              <View style={styles.submissionSection}>
                <Text style={[styles.submissionLabel, { fontFamily, color: colors.textPrimary }]}>
                  {t('homework.submittedContent')}:
                </Text>
                <View style={[styles.submissionContent, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
                  <Text style={[styles.submissionText, { fontFamily, color: colors.textPrimary }]}>
                    {submission?.content || t('submissions.noContent')}
                  </Text>
                </View>
              </View>

              {submission?.attachments && submission.attachments.length > 0 && (
                <View style={styles.submissionSection}>
                  <Text style={[styles.submissionLabel, { fontFamily, color: colors.textPrimary }]}>
                    {t('submissions.attachments')}:
                  </Text>
                  <View style={styles.attachmentsContainer}>
                    {submission.attachments.map((attachment, index) => (
                      <View
                        key={index}
                        style={[styles.attachmentItem, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
                        <Ionicons name="document" size={20} color={colors.textSecondary} />
                        <Text
                          style={[styles.attachmentText, { fontFamily, color: colors.textPrimary }]}
                          numberOfLines={1}>
                          {attachment}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <Text style={[styles.submittedDate, { fontFamily, color: colors.textSecondary }]}>
                {t('homework.submittedOn')}: {formatDate(submission?.submitted_at || '')}
              </Text>

              {/* Grade and Feedback Section */}
              {submission?.grade !== undefined && submission?.grade !== null && (
                <View style={[styles.gradeContainer, {
                  backgroundColor: getGradeBgColor(submission.grade, homework.points),
                  borderColor: getGradeColor(submission.grade, homework.points) + '40'
                }]}>
                  <Text style={[styles.gradeText, { 
                    fontFamily, 
                    color: getGradeColor(submission.grade, homework.points) 
                  }]}>
                    {t('homework.grade')}: {submission.grade}/{homework.points}
                  </Text>

                  {/* Component grades */}
                  {submission.text_grade !== undefined && submission.text_grade !== null && (
                    <Text style={[styles.componentGradeText, { 
                      fontFamily, 
                      color: getGradeColor(submission.text_grade, homework.points - (homework.questions?.reduce((sum, q) => sum + q.points, 0) || 0))
                    }]}>
                      {t('homework.textSubmission')}: {submission.text_grade} {t('common.points')}
                    </Text>
                  )}

                  {submission.question_grades && submission.question_grades.length > 0 && (
                    <Text style={[styles.componentGradeText, { 
                      fontFamily, 
                      color: getGradeColor(submission.question_grades.reduce((sum, qg) => sum + (qg.grade || 0), 0), homework.questions?.reduce((sum, q) => sum + q.points, 0) || 0)
                    }]}>
                      {t('homework.questionPoints')}: {submission.question_grades.reduce((sum, qg) => sum + (qg.grade || 0), 0)} {t('common.points')}
                    </Text>
                  )}

                  {submission.feedback && (
                    <Text style={[styles.feedbackText, { 
                      fontFamily, 
                      color: getGradeColor(submission.grade, homework.points) 
                    }]}>
                      {t('homework.feedback')}: {submission.feedback}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.card, { 
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.border,
              ...designTokens.shadows.sm
            }]}>
              <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary }]}>
                {t('homework.yourSubmission')}
              </Text>

              <View style={styles.submissionSection}>
                <Text style={[styles.submissionLabel, { fontFamily, color: colors.textPrimary }]}>
                  {t('homework.answerContent')} *
                </Text>
                <View style={[styles.answerInput, { 
                  borderColor: colors.border,
                  backgroundColor: colors.background 
                }]}>
                  <TextInput
                    style={[styles.textInput, { 
                      fontFamily, 
                      color: colors.textPrimary 
                    }]}
                    placeholder={t('homework.typeSubmission')}
                    placeholderTextColor={colors.textTertiary}
                    value={submissionContent}
                    onChangeText={setSubmissionContent}
                    multiline
                    editable={canSubmit}
                  />
                </View>
              </View>

              {homework.attachments && (
                <View style={styles.submissionSection}>
                  <Text style={[styles.submissionLabel, { fontFamily, color: colors.textPrimary }]}>
                    {t('submissions.attachments')}
                  </Text>

                  {attachments.length > 0 && (
                    <View style={styles.attachmentsContainer}>
                      {attachments.map((attachment, index) => (
                        <View
                          key={index}
                          style={[styles.attachmentItem, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
                          <Ionicons name="document" size={20} color={colors.textSecondary} />
                          <Text
                            style={[styles.attachmentText, { fontFamily, color: colors.textPrimary }]}
                            numberOfLines={1}>
                            {attachment}
                          </Text>
                          <TouchableOpacity
                            onPress={() => removeAttachment(index)}
                            disabled={!canSubmit}>
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={pickDocument}
                    disabled={!canSubmit || uploading}
                    style={[styles.attachmentButton, {
                      borderColor: canSubmit ? '#3B82F6' : colors.border,
                      backgroundColor: canSubmit ? '#3B82F615' : colors.background
                    }]}>
                    {uploading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons
                          name="attach"
                          size={20}
                          color={canSubmit ? "#3B82F6" : colors.textTertiary}
                        />
                        <Text style={[styles.attachmentButtonText, { 
                          fontFamily, 
                          color: canSubmit ? '#3B82F6' : colors.textTertiary 
                        }]}>
                          {t('homework.addAttachment')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {isOverdue && (
                <View style={[styles.overdueContainer, { 
                  backgroundColor: '#DC262615',
                  borderColor: '#DC262640'
                }]}>
                  <Text style={[styles.overdueText, { fontFamily, color: '#DC2626' }]}>
                    {t('homework.assignmentOverdue')}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSubmitHomework}
                disabled={!canSubmit || !submissionContent.trim() || submitting}
                style={[styles.submitButton, {
                  backgroundColor: !canSubmit || !submissionContent.trim() || submitting ?
                    '#93C5FD' :
                    colors.primary
                }]}>
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[styles.submitButtonText, { fontFamily, color: 'white' }]}>
                    {isOverdue ? t('homework.submissionClosed') : t('homework.submitHomework')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={`${t('homework.homework')}: ${homework?.title || t('homework.assignment')}`}
          link={generateHomeworkLink(
            id as string,
            { subject: homework?.subject, title: homework?.title }
          )}
          subject={homework?.subject}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xl
  },
  errorTitle: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm
  },
  errorSubtitle: {
    fontSize: designTokens.typography.body.fontSize,
    textAlign: 'center',
    marginBottom: designTokens.spacing.xl
  },
  backButton: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingVertical: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.xl
  },
  backButtonText: {
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize
  },
  header: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.xl,
    borderBottomWidth: 1
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.lg
  },
  rtlRow: {
    flexDirection: 'row-reverse'
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm
  },
  statusBadge: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full
  },
  statusText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600'
  },
  title: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight,
    marginBottom: designTokens.spacing.md
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm
  },
  tag: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full
  },
  tagText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600'
  },
  content: {
    padding: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.lg
  },
  card: {
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.xl,
    borderWidth: 1,
    marginBottom: designTokens.spacing.xl
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designTokens.spacing.md
  },
  cardTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: designTokens.typography.headline.fontWeight,
    marginBottom: 2
  },
  cardSubtitle: {
    fontSize: designTokens.typography.footnote.fontSize,
  },
  sectionTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight,
    marginBottom: designTokens.spacing.md
  },
  description: {
    fontSize: designTokens.typography.body.fontSize,
  },
  questionContainer: {
    marginBottom: designTokens.spacing.lg,
    borderBottomWidth: 1
  },
  questionText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.sm
  },
  optionsContainer: {
    marginBottom: designTokens.spacing.sm
  },
  optionText: {
    fontSize: designTokens.typography.body.fontSize,
    marginLeft: designTokens.spacing.md
  },
  submissionContent: {
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg
  },
  submissionText: {
    fontSize: designTokens.typography.body.fontSize,
  },
  gradeContainer: {
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    marginTop: designTokens.spacing.md
  },
  gradeText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs
  },
  feedbackText: {
    fontSize: designTokens.typography.body.fontSize,
    marginTop: designTokens.spacing.xs
  },
  answerInput: {
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    minHeight: 80
  },
  textInput: {
    padding: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
    textAlignVertical: 'top',
    height: 80
  },
  submissionSection: {
    marginBottom: designTokens.spacing.md
  },
  submissionLabel: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.sm
  },
  attachmentsContainer: {
    gap: designTokens.spacing.sm
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg
  },
  attachmentText: {
    marginLeft: designTokens.spacing.sm,
    fontSize: designTokens.typography.body.fontSize,
    flex: 1
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed'
  },
  attachmentButtonText: {
    marginLeft: designTokens.spacing.sm,
    fontWeight: '600'
  },
  submittedDate: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginTop: designTokens.spacing.sm
  },
  componentGradeText: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginTop: designTokens.spacing.xs
  },
  overdueContainer: {
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    borderWidth: 1,
    marginBottom: designTokens.spacing.lg
  },
  overdueText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    textAlign: 'center'
  },
  submitButton: {
    paddingVertical: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.xl,
    alignItems: 'center'
  },
  submitButtonText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600'
  }
});
