// app/(student)/exam/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  AppState,
  AppStateStatus,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import Alert from '@/components/Alert';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '../../../src/services/api';
import { Exam, Question } from '../../../src/types';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '@/utils/designTokens';

// Update the ExamDetails interface to properly type nested questions
interface ExamDetails extends Exam {
  questions: (Question & {
    parent_id?: string;
    is_section?: boolean;
    question_order?: number;
    attachment_url?: string;
    attachment_type?: 'image' | 'pdf';
    nested_questions?: (Question & {
      parent_id?: string;
      is_section?: boolean;
      question_order?: number;
      attachment_url?: string;
      attachment_type?: 'image' | 'pdf';
      nested_questions?: any[];
    })[];
  })[];
  teacher?: {
    id: string;
    profile: {
      name: string;
    };
  };
}

interface QuestionAttachment {
  questionId: string;
  url: string;
  type: 'image' | 'pdf';
  name: string;
}

export default function StudentExamScreen() {
  const { t, isRTL, language, toggleLanguage } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const examId = Array.isArray(id) ? id[0] : id;
  const { isDark, colors, toggleTheme } = useThemeContext();

  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: string; }>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasTaken, setHasTaken] = useState(false);
  const [examStatus, setExamStatus] = useState<'available' | 'taken' | 'upcoming' | 'missed'>('available');
  const [questionAttachments, setQuestionAttachments] = useState<QuestionAttachment[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [textAnswerModal, setTextAnswerModal] = useState<{
    visible: boolean;
    questionId: string;
    questionText: string;
    currentAnswer: string;
  }>({
    visible: false,
    questionId: '',
    questionText: '',
    currentAnswer: ''
  });

  // Refs to track auto-submit state
  const isAutoSubmitting = useRef(false);
  const appState = useRef(AppState.currentState);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    loadExamData();
    checkExamStatus();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [examId]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log('AppState changed:', appState.current, '->', nextAppState);
    if (appState.current === 'active' && (nextAppState === 'background' || nextAppState === 'inactive')) {
      console.log('App going to background - triggering auto-submit');
      if (!hasSubmitted.current && !isAutoSubmitting.current) {
        handleAutoSubmit(true);
      }
    }
    appState.current = nextAppState;
  };

  useEffect(() => {
    return () => {
      isAutoSubmitting.current = false;
      hasSubmitted.current = false;
    };
  }, []);

  const loadExamData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExamById(examId!);

      if (response.data.data && response.data.success) {
        const examData = response.data.data;
        setExam(examData as ExamDetails);

        const now = new Date();
        const availableFrom = examData?.available_from ? new Date(examData.available_from) : null;
        const dueDate = examData?.due_date ? new Date(examData.due_date) : null;

        if (availableFrom && now < availableFrom) {
          setExamStatus('upcoming');
        } else if (dueDate && now > dueDate) {
          setExamStatus('missed');
        } else if ((!availableFrom || now >= availableFrom) && (!dueDate || now <= dueDate)) {
          setExamStatus('available');
        } else {
          setExamStatus('available');
        }

        if (examData?.settings?.timed) {
          setTimeLeft(examData.settings.duration * 60);
        }
      } else {
        if (response.status === 403) {
          Alert.alert(t('exams.expired'), response.data.error || t('exams.noLongerAvailable'), [
            { text: t('common.ok'), onPress: () => router.back() }
          ]);
          return;
        }
        throw new Error(response.data.error || t('exams.loadFailed'));
      }
    } catch (error: any) {
      console.error('Failed to load exam:', error);
      if (error.response?.status === 403) {
        Alert.alert(t('common.accessDenied'), error.response.data.error || t('exams.cannotAccess'), [
          { text: t('common.ok'), onPress: () => router.back() }
        ]);
      } else {
        Alert.alert(t('common.error'), t('exams.loadDetailsFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const checkExamStatus = async () => {
    try {
      const taken = await apiService.checkExamTaken(examId!);
      setHasTaken(taken);
      if (taken) {
        setExamStatus('taken');
      }
    } catch (error) {
      console.error('Failed to check exam status:', error);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || hasSubmitted.current) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }

        const newTime = prev - 1;
        if (newTime <= 0 && !isAutoSubmitting.current) {
          console.log('⏰ Time expired - triggering auto-submit');
          handleAutoSubmit(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleAutoSubmit = async (isAuto: boolean = false) => {
    if (isAutoSubmitting.current || hasSubmitted.current) {
      console.log('Auto-submit blocked - already submitting');
      return;
    }

    console.log('🚀 Starting auto-submit process...', { isAuto });
    isAutoSubmitting.current = true;
    submitExam(isAuto);
  };

  const handleSubmit = async () => {
    if (isAutoSubmitting.current || hasSubmitted.current) {
      console.log('Submit blocked - auto-submit in progress or already submitted');
      return;
    }

    if (Object.keys(answers).length === 0) {
      Alert.alert(t('exams.warning'), t('exams.noAnswersWarning'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('exams.submit'), onPress: () => submitExam(false) }
      ]);
      return;
    }

    // Get all non-section questions recursively
    const getAllNonSectionQuestions = (questions: any[]): any[] => {
      return questions.reduce((acc, question) => {
        if (!question.is_section) {
          acc.push(question);
        }

        if (question.nested_questions && question.nested_questions.length > 0) {
          acc.push(...getAllNonSectionQuestions(question.nested_questions));
        }

        return acc;
      }, [] as any[]);
    };

    const allQuestions = exam?.questions ? getAllNonSectionQuestions(exam.questions) : [];
    const unansweredQuestions = allQuestions.filter((q) => !answers[q.id]);

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        t('exams.unansweredQuestions'),
        `${t('exams.youHave')} ${unansweredQuestions.length} ${t('exams.unansweredQuestionsText')}`,
        [
          { text: t('exams.continueEditing'), style: 'cancel' },
          { text: t('exams.submitAnyway'), onPress: () => submitExam(false) }
        ]
      );
    } else {
      submitExam(false);
    }
  };

  const submitExam = async (isAutoSubmit: boolean = false) => {
    if (hasSubmitted.current) {
      console.log('Submit blocked - already submitted');
      isAutoSubmitting.current = false;
      return;
    }

    try {
      setSubmitting(true);
      hasSubmitted.current = true;
      console.log('📤 Starting exam submission...', { isAutoSubmit, answers });

      // Extract image URLs from attachments
      const imageUrls = questionAttachments.map(att => att.url);

      const response = await apiService.submitExamAnswers(examId, answers, imageUrls);

      console.log('✅ Exam submission response:', response.data);

      if (response.data.success) {
        const submissionData = response.data.data;
        const submissionId = submissionData.submission?.id;

        if (submissionData.needsManualGrading) {
          Alert.alert(
            isAutoSubmit ? t('exams.autoSubmitted') : t('exams.submitted'),
            isAutoSubmit ?
              t('exams.autoSubmittedGrading') :
              t('exams.submittedGrading'),
            [
              {
                text: t('common.ok'),
                onPress: () => router.push('/(student)/exams')
              }
            ]
          );
        } else {
          router.replace(`/(student)/exam/results/${examId}?submissionId=${submissionId}`);
        }
      } else {
        Alert.alert(t('exams.submissionFailed'), response.data.error || t('exams.unknownError'));
        hasSubmitted.current = false;
      }
    } catch (error: any) {
      console.error('❌ Exam submission error:', error);
      Alert.alert(t('common.error'), t('exams.submitFailed'));
      hasSubmitted.current = false;
    } finally {
      setSubmitting(false);
      isAutoSubmitting.current = false;
    }
  };

  const uploadAttachment = async (questionId: string) => {
    try {
      setUploadingImages(true);

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('exams.permissionRequired'), t('exams.cameraRollPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });

      const mimeType = 'image/jpeg';
      const fileName = `question-${questionId}-${Date.now()}.jpg`;

      // Upload to server
      const uploadResponse = await apiService.uploadFileBase64({
        file: `data:${mimeType};base64,${base64}`,
        fileName,
        fileType: mimeType
      }
      );

      if (uploadResponse.data.success) {
        const newAttachment: QuestionAttachment = {
          questionId,
          url: uploadResponse.data.data.url,
          type: 'image',
          name: fileName
        };

        setQuestionAttachments(prev => [...prev, newAttachment]);
        Alert.alert(t('common.success'), t('exams.attachmentUploaded'));
      } else {
        throw new Error(uploadResponse.data.error || t('exams.uploadFailed'));
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert(t('common.error'), error.message || t('exams.uploadAttachmentFailed'));
    } finally {
      setUploadingImages(false);
    }
  };

  const removeAttachment = (attachmentUrl: string) => {
    setQuestionAttachments(prev => prev.filter(att => att.url !== attachmentUrl));
  };

  const openTextAnswerModal = (questionId: string, questionText: string, currentAnswer: string = '') => {
    setTextAnswerModal({
      visible: true,
      questionId,
      questionText,
      currentAnswer
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderNestedQuestions = (questions: any[], level = 0, parentIndex = '') => {
    return questions.map((question, index) => {
      // Fix the question numbering to properly handle nested levels
      const questionNumber = parentIndex ? `${parentIndex}.${index + 1}` : `${index + 1}`;

      if (question.is_section) {
        return (
          <View key={question.id} style={[styles.sectionCard, {
            marginLeft: isRTL ? 0 : level * 20,
            marginRight: isRTL ? level * 20 : 0,
            backgroundColor: colors.backgroundSecondary
          }]}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText, { color: colors.textPrimary }]}>{questionNumber}. {question.question}</Text>
            {question.attachment_url && (
              <View style={styles.questionAttachment}>
                <Text style={[styles.attachmentLabel, isRTL && styles.rtlText, { color: colors.textSecondary }]}>{t('exams.sectionAttachment')}:</Text>
                <Image
                  source={{ uri: question.attachment_url }}
                  style={styles.attachmentImage}
                  resizeMode="contain"
                />
              </View>
            )}
            {question.nested_questions && question.nested_questions.length > 0 && (
              <View style={styles.nestedQuestions}>
                {renderNestedQuestions(question.nested_questions, level + 1, questionNumber)}
              </View>
            )}
          </View>
        );
      }

      return (
        <View key={question.id} style={[styles.questionCard, {
          marginLeft: isRTL ? 0 : level * 20,
          marginRight: isRTL ? level * 20 : 0,
          backgroundColor: colors.backgroundElevated
        }]}>
          <Text style={[styles.questionNumber, isRTL && styles.rtlText, { color: colors.primary }]}>
            {t('exams.question')} {questionNumber} ({question.points} {t('common.points')})
          </Text>
          <Text style={[styles.questionText, isRTL && styles.rtlText, { color: colors.textPrimary }]}>{question.question}</Text>

          {/* Display question attachment if exists */}
          {question.attachment_url && (
            <View style={styles.questionAttachment}>
              <Text style={[styles.attachmentLabel, isRTL && styles.rtlText, { color: colors.textSecondary }]}>{t('exams.questionAttachment')}:</Text>
              <Image
                source={{ uri: question.attachment_url }}
                style={styles.attachmentImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Student attachments for this question */}
          {questionAttachments.filter(att => att.questionId === question.id).map((attachment, attIndex) => (
            <View key={attIndex} style={[styles.studentAttachment, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={[styles.attachmentHeader, isRTL && styles.rtlRow]}>
                <Text style={[styles.attachmentName, isRTL && styles.rtlText, { color: colors.primary }]}>{t('exams.yourAttachment')} {attIndex + 1}</Text>
                <TouchableOpacity onPress={() => removeAttachment(attachment.url)}>
                  <Ionicons name="close-circle" size={20} color={colors.accentTertiary} />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: attachment.url }} style={styles.attachmentImage} resizeMode="contain" />
            </View>
          ))}

          {/* Upload attachment button */}
          {exam?.allow_image_submissions && (
            <TouchableOpacity
              style={[styles.uploadButton, {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border
              }]}
              onPress={() => uploadAttachment(question.id)}
              disabled={uploadingImages}
            >
              {uploadingImages ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="attach" size={16} color={colors.primary} />
                  <Text style={[styles.uploadButtonText, isRTL && styles.rtlText, { color: colors.primary }]}>{t('exams.addAttachment')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {question.type === 'mcq' ? (
            <View style={[styles.optionsContainer, isRTL && styles.rtlOptions]}>
              {question.options.map((option: any, optionIndex: any) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.option,
                    answers[question.id] === option && styles.optionSelected,
                    isRTL && styles.rtlOption,
                    {
                      backgroundColor: answers[question.id] === option ? colors.backgroundSecondary : colors.backgroundSecondary,
                      borderColor: answers[question.id] === option ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => handleAnswerSelect(question.id, option)}
                >
                  <View style={[styles.optionRadio, isRTL && styles.rtlRadio, { borderColor: colors.textTertiary }]}>
                    {answers[question.id] === option && (
                      <View style={[styles.optionRadioSelected, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <Text style={[styles.optionText, isRTL && styles.rtlText, { color: colors.textPrimary }]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.textAnswerContainer}>
              <Text style={[styles.textAnswerHint, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
                {t('exams.typeAnswer')}
              </Text>
              <TouchableOpacity
                style={[styles.textInputButton, {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border
                }]}
                onPress={() => openTextAnswerModal(question.id, question.question, answers[question.id] || '')}
              >
                <Text style={[styles.answerPreview, isRTL && styles.rtlText, { color: answers[question.id] ? colors.textPrimary : colors.textTertiary }]}>
                  {answers[question.id] || t('exams.tapToAddAnswer')}
                </Text>
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          {/* Render nested questions */}
          {question.nested_questions && question.nested_questions.length > 0 && (
            <View style={styles.nestedQuestions}>
              {renderNestedQuestions(question.nested_questions, level + 1, questionNumber)}
            </View>
          )}
        </View>
      );
    });
  };

  // Text Answer Modal Component
  const TextAnswerModal = () => {
    const [localAnswer, setLocalAnswer] = useState(textAnswerModal.currentAnswer);

    // Update local state when modal opens
    useEffect(() => {
      if (textAnswerModal.visible) {
        setLocalAnswer(textAnswerModal.currentAnswer);
      }
    }, [textAnswerModal.visible, textAnswerModal.currentAnswer]);

    const handleSave = () => {
      if (textAnswerModal.questionId && localAnswer.trim()) {
        handleAnswerSelect(textAnswerModal.questionId, localAnswer.trim());
      }
      setTextAnswerModal({
        visible: false,
        questionId: '',
        questionText: '',
        currentAnswer: ''
      });
    };

    const handleCancel = () => {
      setTextAnswerModal({
        visible: false,
        questionId: '',
        questionText: '',
        currentAnswer: ''
      });
    };

    return (
      <Modal
        visible={textAnswerModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, isRTL && styles.rtlRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, isRTL && styles.rtlText, { color: colors.textPrimary }]}>{t('exams.yourAnswer')}</Text>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalQuestion, isRTL && styles.rtlText, { color: colors.textPrimary }]}>{textAnswerModal.questionText}</Text>

            <TextInput
              style={[styles.textInput, isRTL && styles.rtlInput, {
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.backgroundElevated
              }]}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              value={localAnswer}
              onChangeText={setLocalAnswer}
              placeholder={t('exams.typeDetailedAnswer')}
              placeholderTextColor={colors.textTertiary}
              autoFocus={true}
            />

            <View style={[styles.modalActions, isRTL && styles.rtlRow]}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelButtonText, isRTL && styles.rtlText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={[styles.saveButtonText, isRTL && styles.rtlText, { color: '#FFFFFF' }]}>{t('exams.saveAnswer')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, isRTL && styles.rtlText, { color: colors.textSecondary }]}>{t('exams.loadingExam')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!exam) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isRTL && styles.rtlText, { color: colors.accentTertiary }]}>{t('exams.notFound')}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <Text style={[styles.buttonText, isRTL && styles.rtlText, { color: '#FFFFFF' }]}>{t('common.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check exam status
  const isMissed = examStatus === 'missed';
  const isUpcoming = examStatus === 'upcoming';

  if (isMissed) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isRTL && styles.rtlText, { color: colors.accentTertiary }]}>{t('exams.expired')}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
            {t('exams.dueDatePassed')}
          </Text>
          {exam?.due_date && (
            <Text style={[styles.subtitle, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
              {t('exams.dueDateWas')}: {new Date(exam.due_date).toLocaleString()}
            </Text>
          )}
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => router.push('/exams')}>
            <Text style={[styles.buttonText, isRTL && styles.rtlText, { color: '#FFFFFF' }]}>{t('exams.backToExams')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (hasTaken) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isRTL && styles.rtlText, { color: colors.accentTertiary }]}>{t('exams.alreadyTaken')}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
            {t('exams.alreadyCompleted')}
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => router.push('/exams')}>
            <Text style={[styles.buttonText, isRTL && styles.rtlText, { color: '#FFFFFF' }]}>{t('exams.backToExams')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isUpcoming) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isRTL && styles.rtlText, { color: colors.accentTertiary }]}>{t('exams.notAvailableYet')}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
            {t('exams.scheduledFuture')}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
            {t('exams.availableOn')}: {new Date(exam.due_date!).toLocaleDateString()}
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => router.push('/exams')}>
            <Text style={[styles.buttonText, isRTL && styles.rtlText, { color: '#FFFFFF' }]}>{t('exams.backToExams')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Helper function to count non-section questions recursively - MOVE THIS UP
  const countNonSectionQuestions = (questions: any[]): number => {
    return questions.reduce((count, question) => {
      let totalCount = question.is_section ? count : count + 1;

      if (question.nested_questions && question.nested_questions.length > 0) {
        totalCount += countNonSectionQuestions(question.nested_questions);
      }

      return totalCount;
    }, 0);
  };

  // Update the progress calculation to count only non-section questions
  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = exam.questions ?
    exam.questions.reduce((count, question) => {
      // Count this question if it's not a section
      let totalCount = question.is_section ? count : count + 1;

      // Also count nested questions recursively
      if (question.nested_questions && question.nested_questions.length > 0) {
        const nestedCount = countNonSectionQuestions(question.nested_questions);
        totalCount += nestedCount;
      }

      return totalCount;
    }, 0) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TextAnswerModal />

      {showWarning && (
        <View style={[styles.warningBanner, { backgroundColor: isDark ? '#332900' : '#FFF9E6' }]}>
          <View style={[styles.warningContent, isRTL && styles.rtlRow]}>
            <Text style={[styles.warningText, isRTL && styles.rtlText, {display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', color: isDark ? '#FFD700' : '#AA7700' }]}>
              <Ionicons name="warning-outline" style={{marginRight: 4, marginLeft: 4}} size={16} color={isDark ? '#FFD700' : '#AA7700'} />
              {t('exams.autoSubmitWarning')}
            </Text>
            <TouchableOpacity onPress={() => setShowWarning(false)} style={styles.warningCloseButton}>
              <Text style={[styles.warningCloseText, { color: colors.textTertiary }]}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, isRTL && styles.rtlRow, {
        backgroundColor: colors.backgroundElevated,
        borderBottomColor: colors.border
      }]}>

        {/* Go back */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, isRTL && styles.rtlText, { color: colors.primary }]}>
            {isRTL ? "العودة ←" : "← Back"}
          </Text>
        </TouchableOpacity>

        {/* Language Toggle */}
        <TouchableOpacity
          onPress={toggleLanguage}
          style={[styles.themeToggle, { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.sm }]}
        >
          <Ionicons
            name={language === 'en' ? 'language' : 'globe'}
            size={20}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        {/* Dark Mode Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeToggle, { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.sm }]}
        >
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        {timeLeft !== null && (
          <View style={[styles.timer, timeLeft < 300 && styles.timerWarning, {
            backgroundColor: timeLeft < 300 ? colors.accentTertiary : colors.accentSecondary
          }]}>
            <Text style={[styles.timerText, isRTL && styles.rtlText, { color: '#FFFFFF' }]}>{formatTime(timeLeft)}</Text>
          </View>
        )}
      </View>

      {/* Exam Info */}
      <View style={[styles.examInfo, {
        backgroundColor: colors.backgroundElevated,
        borderBottomColor: colors.border
      }]}>
        <Text style={[styles.examTitle, isRTL && styles.rtlText, { color: colors.textPrimary }]}>{exam.title}</Text>
        <Text style={[styles.examSubject, isRTL && styles.rtlText, { color: colors.textSecondary }]}>{exam.subject} • {exam.class}</Text>
        {exam.teacher && (
          <Text style={[styles.teacherName, isRTL && styles.rtlText, { color: colors.textTertiary }]}>
            {t('common.teacher')}: {exam.teacher.profile.name}
          </Text>
        )}

        {exam.settings?.timed && (
          <View style={styles.examSettings}>
            <Text style={[styles.settingsText, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
              ⏱️ {t('exams.timed')}: {exam.settings.duration} {t('exams.minutes')}
            </Text>
          </View>
        )}

        {exam.due_date && (
          <View style={[styles.dueDateContainer, {
            backgroundColor: isDark ? '#332900' : '#FFF9E6',
            borderLeftColor: colors.accent
          }]}>
            <Text style={[styles.dueDateText, isRTL && styles.rtlText, { color: colors.textPrimary }]}>
              {t('exams.due')}: {new Date(exam.due_date).toLocaleDateString()} {t('exams.at')} {new Date(exam.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}

        {exam.allow_image_submissions && (
          <View style={[styles.imageSubmissionNote, { backgroundColor: isDark ? '#00293D' : '#E3F2FD' }]}>
            <Ionicons name="camera" size={16} color={colors.primary} />
            <Text style={[styles.imageSubmissionText, isRTL && styles.rtlText, { color: colors.primary }]}>
              {t('exams.imageAttachmentsAllowed')}
            </Text>
          </View>
        )}
      </View>

      {/* Questions */}
      <Animated.ScrollView entering={FadeIn.duration(600)} style={[styles.questionsContainer, { backgroundColor: colors.background }]}>
        {exam.questions && renderNestedQuestions(exam.questions)}
      </Animated.ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, {
        backgroundColor: colors.backgroundElevated,
        borderTopColor: colors.border
      }]}>
        <Text style={[styles.progressText, isRTL && styles.rtlText, { color: colors.textSecondary }]}>
          {t('exams.answered')}: {answeredQuestions}/{totalQuestions}
          {questionAttachments.length > 0 && ` • ${t('exams.attachments')}: ${questionAttachments.length}`}
        </Text>
        <TouchableOpacity
          style={[styles.submitButton,
          (submitting || timeLeft === 0) && styles.submitButtonDisabled,
          { backgroundColor: (submitting || timeLeft === 0) ? colors.textTertiary : colors.primary }
          ]}
          onPress={handleSubmit}
          disabled={submitting || timeLeft === 0}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.submitButtonText, isRTL && styles.rtlText, { color: '#FFFFFF' }]}>
              {timeLeft === 0 ? t('exams.timeExpired') : t('exams.submitExam')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  warningBanner: {
    borderBottomWidth: 1,
    padding: 12
  },
  warningContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  rtlRow: {
    flexDirection: 'row-reverse'
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20
  },
  warningCloseButton: {
    padding: 4,
    marginLeft: 8
  },
  warningCloseText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    flex: 1,
    justifyContent: 'flex-start'
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500'
  },
  themeToggle: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    margin: designTokens.spacing.xxs,
    ...designTokens.shadows.sm,
  },
  timer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  timerWarning: {
  },
  timerText: {
    fontWeight: 'bold',
    fontSize: 14
  },
  examInfo: {
    padding: 20,
    borderBottomWidth: 1,
  },
  examTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  examSubject: {
    fontSize: 16,
    marginBottom: 4
  },
  teacherName: {
    fontSize: 14,
    marginBottom: 8
  },
  examSettings: {
    marginTop: 8
  },
  settingsText: {
    fontSize: 14,
  },
  dueDateContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  dueDateText: {
    fontSize: 14,
    fontWeight: '500'
  },
  imageSubmissionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    borderRadius: 8
  },
  imageSubmissionText: {
    marginLeft: 8,
    fontSize: 14,
  },
  questionsContainer: {
    flex: 1,
    padding: 16
  },
  sectionCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  questionCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  questionText: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22
  },
  questionAttachment: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8
  },
  attachmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  studentAttachment: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  attachmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16
  },
  uploadButtonText: {
    marginLeft: 8,
    fontWeight: '600'
  },
  optionsContainer: {
    marginTop: 8
  },
  rtlOptions: {
    alignItems: 'flex-end'
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionSelected: {
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rtlRadio: {
    marginLeft: 12,
    marginRight: 0
  },
  optionRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  textAnswerContainer: {
    marginTop: 8
  },
  textAnswerHint: {
    fontSize: 14,
    marginBottom: 8
  },
  textInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 60
  },
  answerPreview: {
    flex: 1,
    fontSize: 16,
    fontStyle: 'italic'
  },
  nestedQuestions: {
    marginTop: 16,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5E5'
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  submitButtonDisabled: {
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600'
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  modalQuestion: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 20
  },
  rtlInput: {
    textAlign: 'right'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  rtlText: {
    textAlign: 'right'
  },
  rtlOption: {
    flexDirection: 'row-reverse'
  }
});
