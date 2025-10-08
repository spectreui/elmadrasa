// app/exam/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Exam, Question, ApiResponse } from '../../src/types';

interface ExamDetails extends Exam {
  questions: Question[];
  teacher?: {
    id: string;
    profile: {
      name: string;
    };
  };
}

export default function StudentExamScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const examId = Array.isArray(id) ? id[0] : id;

  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasTaken, setHasTaken] = useState(false);

  useEffect(() => {
    loadExamData();
    checkExamStatus();
  }, [examId]);

  const loadExamData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExamById(examId!);
      
      if (response.data.data && response.data.success) {
        setExam(response.data.data);
        
        // Initialize timer if exam is timed
        if (response.data.data.settings?.timed) {
          setTimeLeft(response.data.data.settings.duration * 60); // Convert to seconds
        }
      }
    } catch (error: any) {
      console.error('Failed to load exam:', error);
      Alert.alert('Error', 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const checkExamStatus = async () => {
    try {
      const taken = await apiService.checkExamTaken(examId!);
      setHasTaken(taken);
    } catch (error) {
      console.error('Failed to check exam status:', error);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (prev === 1) {
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleAutoSubmit = async () => {
    Alert.alert(
      'Time Up!',
      'Your exam has been automatically submitted.',
      [{ text: 'OK', onPress: () => handleSubmit() }]
    );
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length === 0) {
      Alert.alert('Warning', 'You haven\'t answered any questions. Are you sure you want to submit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: submitExam }
      ]);
      return;
    }

    // Check if all questions are answered
    const unansweredQuestions = exam?.questions.filter(q => !answers[q.id]) || [];
    
    if (unansweredQuestions.length > 0) {
      Alert.alert(
        'Unanswered Questions',
        `You have ${unansweredQuestions.length} unanswered question(s). Are you sure you want to submit?`,
        [
          { text: 'Continue Editing', style: 'cancel' },
          { text: 'Submit Anyway', onPress: submitExam }
        ]
      );
    } else {
      submitExam();
    }
  };

  const submitExam = async () => {
  try {
    setSubmitting(true);
    console.log('📤 Starting exam submission...');
    
    const response = await apiService.api.post('/submissions/submit', {
      examId: examId,
      answers: answers
    });

    console.log('✅ Exam submission response:', response.data);

    if (response.data.success) {
      const submissionData = response.data.data;
      
      // ✅ Direct navigation without Alert
      console.log('🎯 Navigating directly to results page...');
      router.push({
        pathname: '/exam-results',
        params: { 
          submissionId: submissionData.submission?.id,
          examId: examId,
          score: submissionData.score,
          totalPoints: submissionData.totalPoints,
          percentage: Math.round(submissionData.percentage),
          examTitle: exam?.title || 'Exam Results'
        }
      });
      
    } else {
      Alert.alert('Submission Failed', response.data.error || 'Unknown error occurred');
    }
  } catch (error: any) {
    console.error('❌ Exam submission error:', error);
    Alert.alert('Error', 'Failed to submit exam. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
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
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/exams')}
          >
            <Text style={styles.buttonText}>Back to Exams</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        {timeLeft !== null && (
          <View style={[
            styles.timer,
            timeLeft < 300 && styles.timerWarning // Red when less than 5 minutes
          ]}>
            <Text style={styles.timerText}>
              {formatTime(timeLeft)}
            </Text>
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
      </View>

      {/* Questions */}
      <ScrollView style={styles.questionsContainer}>
        {exam.questions.map((question, index) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>
              Question {index + 1} ({question.points} point{question.points !== 1 ? 's' : ''})
            </Text>
            <Text style={styles.questionText}>{question.question}</Text>
            
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
                <View style={styles.textInput}>
                  <Text style={styles.answerText}>
                    {answers[question.id] || 'Your answer will appear here...'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addAnswerButton}
                  onPress={() => {
                    // For text answers, you might want to implement a modal or separate screen
                    Alert.prompt(
                      'Your Answer',
                      question.question,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Save', 
                          onPress: (answer) => {
                            if (answer) {
                              handleAnswerSelect(question.id, answer);
                            }
                          }
                        }
                      ],
                      'plain-text',
                      answers[question.id] || ''
                    );
                  }}
                >
                  <Text style={styles.addAnswerButtonText}>
                    {answers[question.id] ? 'Edit Answer' : 'Add Answer'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Text style={styles.progressText}>
          Answered: {Object.keys(answers).length}/{exam.questions.length}
        </Text>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || timeLeft === 0) && styles.submitButtonDisabled
          ]}
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
    color: '#FF3B30',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  timer: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerWarning: {
    backgroundColor: '#FF3B30',
  },
  timerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  examInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  examTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  examSubject: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  examSettings: {
    marginTop: 8,
  },
  settingsText: {
    fontSize: 14,
    color: '#666',
  },
  questionsContainer: {
    flex: 1,
    padding: 16,
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
    elevation: 3,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 16,
    lineHeight: 22,
  },
  optionsContainer: {
    marginTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  textAnswerContainer: {
    marginTop: 8,
  },
  textAnswerHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minHeight: 80,
    marginBottom: 12,
  },
  answerText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  addAnswerButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addAnswerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});