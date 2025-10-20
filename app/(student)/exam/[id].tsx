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
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const examId = Array.isArray(id) ? id[0] : id;

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
        setExam(examData);

        // Organize nested questions
        if (examData.questions) {
          const organizedQuestions = organizeNestedQuestions(examData.questions);
          examData.questions = organizedQuestions;
        }

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
          Alert.alert('Exam Expired', response.data.error || 'This exam is no longer available.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
          return;
        }
        throw new Error(response.data.error || 'Failed to load exam');
      }
    } catch (error: any) {
      console.error('Failed to load exam:', error);
      if (error.response?.status === 403) {
        Alert.alert('Access Denied', error.response.data.error || 'You cannot access this exam at this time.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to load exam details');
      }
    } finally {
      setLoading(false);
    }
  };

  const organizeNestedQuestions = (questions: any[]) => {
    const questionMap = new Map();
    const rootQuestions: any[] = [];

    // First pass: create map and identify root questions
    questions.forEach(question => {
      questionMap.set(question.id, { ...question, nested_questions: [] });

      if (!question.parent_id) {
        rootQuestions.push(questionMap.get(question.id));
      }
    });

    // Second pass: build hierarchy
    questions.forEach(question => {
      if (question.parent_id && questionMap.has(question.parent_id)) {
        questionMap.get(question.parent_id).nested_questions.push(questionMap.get(question.id));
      }
    });

    // Sort by question_order if available
    const sortedRoots = rootQuestions.sort((a, b) => (a.question_order || 0) - (b.question_order || 0));

    // Also sort nested questions recursively
    const sortNested = (questions: any[]) => {
      return questions.sort((a, b) => (a.question_order || 0) - (b.question_order || 0)).map(q => {
        if (q.nested_questions && q.nested_questions.length > 0) {
          q.nested_questions = sortNested(q.nested_questions);
        }
        return q;
      });
    };

    return sortNested(sortedRoots);
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
      Alert.alert('Warning', 'You haven\'t answered any questions. Are you sure you want to submit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => submitExam(false) }
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
        'Unanswered Questions',
        `You have ${unansweredQuestions.length} unanswered question(s). Are you sure you want to submit?`,
        [
          { text: 'Continue Editing', style: 'cancel' },
          { text: 'Submit Anyway', onPress: () => submitExam(false) }
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

      const response = await apiService.api.post('/submissions/submit', {
        examId: examId,
        answers: answers,
        imageUrls: imageUrls
      });

      console.log('✅ Exam submission response:', response.data);

      if (response.data.success) {
        const submissionData = response.data.data;
        const submissionId = submissionData.submission?.id;

        if (submissionData.needsManualGrading) {
          Alert.alert(
            isAutoSubmit ? 'Auto-Submitted for Grading' : 'Submitted for Grading',
            isAutoSubmit ?
              'Your exam was automatically submitted and is waiting for manual grading.' :
              'Your exam has been submitted and is waiting for manual grading by your teacher.',
            [
              {
                text: 'OK',
                onPress: () => router.push('/exams')
              }
            ]
          );
        } else {
          router.replace(`/exam/results/${examId}?submissionId=${submissionId}`);
        }
      } else {
        Alert.alert('Submission Failed', response.data.error || 'Unknown error occurred');
        hasSubmitted.current = false;
      }
    } catch (error: any) {
      console.error('❌ Exam submission error:', error);
      Alert.alert('Error', 'Failed to submit exam. Please try again.');
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
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload images.');
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
        encoding: FileSystem.EncodingType.Base64,
      });

      const mimeType = 'image/jpeg';
      const fileName = `question-${questionId}-${Date.now()}.jpg`;

      // Upload to server
      const uploadResponse = await apiService.api.post('/upload/file', {
        file: `data:${mimeType};base64,${base64}`,
        fileName,
        fileType: mimeType,
      });

      if (uploadResponse.data.success) {
        const newAttachment: QuestionAttachment = {
          questionId,
          url: uploadResponse.data.data.url,
          type: 'image',
          name: fileName
        };

        setQuestionAttachments(prev => [...prev, newAttachment]);
        Alert.alert('Success', 'Attachment uploaded successfully!');
      } else {
        throw new Error(uploadResponse.data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload attachment');
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

  const saveTextAnswer = (answer: string) => {
    if (textAnswerModal.questionId && answer.trim()) {
      handleAnswerSelect(textAnswerModal.questionId, answer.trim());
    }
    setTextAnswerModal({
      visible: false,
      questionId: '',
      questionText: '',
      currentAnswer: ''
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderNestedQuestions = (questions: any[], level = 0, parentIndex = '') => {
    return questions.map((question, index) => {
      const questionNumber = parentIndex ? `${parentIndex}.${index + 1}` : `${index + 1}`;

      if (question.is_section) {
        return (
          <View key={question.id} style={[styles.sectionCard, { marginLeft: level * 20 }]}>
            <Text style={styles.sectionTitle}>{questionNumber}. {question.question}</Text>
            {question.attachment_url && (
              <View style={styles.questionAttachment}>
                <Text style={styles.attachmentLabel}>Section Attachment:</Text>
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
        <View key={question.id} style={[styles.questionCard, { marginLeft: level * 20 }]}>
          <Text style={styles.questionNumber}>
            Question {questionNumber} ({question.points} point{question.points !== 1 ? 's' : ''})
          </Text>
          <Text style={styles.questionText}>{question.question}</Text>

          {/* Display question attachment if exists */}
          {question.attachment_url && (
            <View style={styles.questionAttachment}>
              <Text style={styles.attachmentLabel}>Question Attachment:</Text>
              <Image
                source={{ uri: question.attachment_url }}
                style={styles.attachmentImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Student attachments for this question */}
          {questionAttachments.filter(att => att.questionId === question.id).map((attachment, attIndex) => (
            <View key={attIndex} style={styles.studentAttachment}>
              <View style={styles.attachmentHeader}>
                <Text style={styles.attachmentName}>Your attachment {attIndex + 1}</Text>
                <TouchableOpacity onPress={() => removeAttachment(attachment.url)}>
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: attachment.url }} style={styles.attachmentImage} resizeMode="contain" />
            </View>
          ))}

          {/* Upload attachment button */}
          {exam?.allow_image_submissions && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => uploadAttachment(question.id)}
              disabled={uploadingImages}
            >
              {uploadingImages ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <>
                  <Ionicons name="attach" size={16} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>Add Attachment</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {question.type === 'mcq' ? (
            <View style={styles.optionsContainer}>
              {question.options.map((option, optionIndex) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.option,
                    answers[question.id] === option && styles.optionSelected
                  ]}
                  onPress={() => handleAnswerSelect(question.id, option)}
                >
                  <View style={styles.optionRadio}>
                    {answers[question.id] === option && (
                      <View style={styles.optionRadioSelected} />
                    )}
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.textAnswerContainer}>
              <Text style={styles.textAnswerHint}>
                Type your answer below:
              </Text>
              <TouchableOpacity
                style={styles.textInputButton}
                onPress={() => openTextAnswerModal(question.id, question.question, answers[question.id] || '')}
              >
                <Text style={styles.answerPreview}>
                  {answers[question.id] || 'Tap to add your answer...'}
                </Text>
                <Ionicons name="create-outline" size={20} color="#007AFF" />
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
  // Replace the existing TextAnswerModal component with this improved version
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Answer</Text>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalQuestion}>{textAnswerModal.questionText}</Text>

            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              value={localAnswer}
              onChangeText={setLocalAnswer}
              placeholder="Type your detailed answer here..."
              autoFocus={true}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save Answer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading Exam...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!exam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Exam not found</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Exam Expired</Text>
          <Text style={styles.subtitle}>
            The due date for this exam has passed.
          </Text>
          {exam?.due_date && (
            <Text style={styles.subtitle}>
              Due date was: {new Date(exam.due_date).toLocaleString()}
            </Text>
          )}
          <TouchableOpacity style={styles.button} onPress={() => router.push('/exams')}>
            <Text style={styles.buttonText}>Back to Exams</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (hasTaken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Exam Already Taken</Text>
          <Text style={styles.subtitle}>
            You have already completed this exam.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/exams')}>
            <Text style={styles.buttonText}>Back to Exams</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isUpcoming) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Exam Not Available Yet</Text>
          <Text style={styles.subtitle}>
            This exam is scheduled for a future date.
          </Text>
          <Text style={styles.subtitle}>
            Available on: {new Date(exam.due_date!).toLocaleDateString()}
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/exams')}>
            <Text style={styles.buttonText}>Back to Exams</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  // Helper function to count non-section questions recursively
  const countNonSectionQuestions = (questions: any[]): number => {
    return questions.reduce((count, question) => {
      let totalCount = question.is_section ? count : count + 1;

      if (question.nested_questions && question.nested_questions.length > 0) {
        totalCount += countNonSectionQuestions(question.nested_questions);
      }

      return totalCount;
    }, 0);
  };


  return (
    <SafeAreaView style={styles.container}>
      <TextAnswerModal />

      {showWarning && (
        <View style={styles.warningBanner}>
          <View style={styles.warningContent}>
            <Text style={styles.warningText}>
              <Ionicons name="warning-outline" size={16} color="#FFA500" />
              Exam will auto-submit if you leave this page or put the app in background
            </Text>
            <TouchableOpacity onPress={() => setShowWarning(false)} style={styles.warningCloseButton}>
              <Text style={styles.warningCloseText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {timeLeft !== null && (
          <View style={[styles.timer, timeLeft < 300 && styles.timerWarning]}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        )}
      </View>

      {/* Exam Info */}
      <View style={styles.examInfo}>
        <Text style={styles.examTitle}>{exam.title}</Text>
        <Text style={styles.examSubject}>{exam.subject} • {exam.class}</Text>
        {exam.teacher && (
          <Text style={styles.teacherName}>
            Teacher: {exam.teacher.profile.name}
          </Text>
        )}

        {exam.settings?.timed && (
          <View style={styles.examSettings}>
            <Text style={styles.settingsText}>
              ⏱️ Timed: {exam.settings.duration} minutes
            </Text>
          </View>
        )}

        {exam.due_date && (
          <View style={styles.dueDateContainer}>
            <Text style={styles.dueDateText}>
              Due: {new Date(exam.due_date).toLocaleDateString()} at {new Date(exam.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}

        {exam.allow_image_submissions && (
          <View style={styles.imageSubmissionNote}>
            <Ionicons name="camera" size={16} color="#007AFF" />
            <Text style={styles.imageSubmissionText}>
              Image attachments are allowed for questions
            </Text>
          </View>
        )}
      </View>

      {/* Questions */}
      <Animated.ScrollView entering={FadeIn.duration(600)} style={styles.questionsContainer}>
        {exam.questions && renderNestedQuestions(exam.questions)}
      </Animated.ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Text style={styles.progressText}>
          Answered: {answeredQuestions}/{totalQuestions}
          {questionAttachments.length > 0 && ` • Attachments: ${questionAttachments.length}`}
        </Text>
        <TouchableOpacity
          style={[styles.submitButton, (submitting || timeLeft === 0) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || timeLeft === 0}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {timeLeft === 0 ? 'Time Expired' : 'Submit Exam'}
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
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  warningBanner: {
    backgroundColor: '#FFF9E6',
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
    padding: 12
  },
  warningContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#AA7700',
    fontWeight: '500',
    lineHeight: 20
  },
  warningCloseButton: {
    padding: 4,
    marginLeft: 8
  },
  warningCloseText: {
    fontSize: 18,
    color: '#666',
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
    color: '#FF3B30',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5'
  },
  backButton: {
    padding: 8
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500'
  },
  timer: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  timerWarning: {
    backgroundColor: '#FF3B30'
  },
  timerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  },
  examInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5'
  },
  examTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4
  },
  examSubject: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4
  },
  teacherName: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8
  },
  examSettings: {
    marginTop: 8
  },
  settingsText: {
    fontSize: 14,
    color: '#666'
  },
  dueDateContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500'
  },
  dueDateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  imageSubmissionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8
  },
  imageSubmissionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF'
  },
  questionsContainer: {
    flex: 1,
    padding: 16
  },
  sectionCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#007AFF',
    marginBottom: 8
  },
  questionText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 16,
    lineHeight: 22
  },
  questionAttachment: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8
  },
  attachmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  studentAttachment: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB'
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
    color: '#007AFF'
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
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16
  },
  uploadButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '600'
  },
  optionsContainer: {
    marginTop: 8
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5'
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF'
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF'
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E'
  },
  textAnswerContainer: {
    marginTop: 8
  },
  textAnswerHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  textInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minHeight: 60
  },
  answerPreview: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    fontStyle: 'italic'
  },
  nestedQuestions: {
    marginTop: 16,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5E5'
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5'
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC'
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600'
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E'
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  modalQuestion: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 20,
    lineHeight: 22
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 20
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    marginRight: 8
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    marginLeft: 8
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});
