// app/exam-results.tsx - Fixed version
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService } from '../src/services/api';
import { Ionicons } from '@expo/vector-icons';

interface ResultData {
  submission: {
    id: string;
    score: number;
    total_points: number;
    submitted_at: string;
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
  const examId = Array.isArray(params.examId) ? params.examId[0] : params.examId;

  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  useEffect(() => {
    if (submissionId) {
      loadResults();
    } else if (examId) {
      loadLatestSubmission();
    }
  }, [submissionId, examId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      // ✅ FIX: Use public method instead of direct api access
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
      // ✅ FIX: Use public method instead of direct api access
      const response = await apiService.getLatestSubmission(examId!);
      
      if (response.data.success && response.data.data) {
        setResultData(response.data.data);
      } else {
        // Fallback to basic info from params
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
      // Fallback to params data
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
    if (percentage >= 90) return '#34C759'; // Green
    if (percentage >= 80) return '#FFCC00'; // Yellow
    if (percentage >= 70) return '#FF9500'; // Orange
    return '#FF3B30'; // Red
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 80) return 'Good Job!';
    if (percentage >= 70) return 'Not Bad!';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading Results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!resultData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Results Not Available</Text>
          <Text style={styles.errorSubtext}>
            Unable to load exam results. Please try again later.
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

  const percentage = Math.round((resultData.submission.score / resultData.submission.total_points) * 100);
  const correctAnswers = resultData.submission.answers.filter(a => a.is_correct).length;
  const totalQuestions = resultData.submission.answers.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam Results</Text>
        <View style={{ width: 24 }} /> {/* Spacer for balance */}
      </View>

      <ScrollView style={styles.content}>
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.examTitle}>{resultData.exam.title}</Text>
          <Text style={styles.examInfo}>
            {resultData.exam.subject} • {resultData.exam.class}
          </Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>{percentage}%</Text>
            <Text style={styles.scoreText}>
              {resultData.submission.score}/{resultData.submission.total_points}
            </Text>
          </View>
          
          <Text style={[styles.gradeText, { color: getGradeColor(percentage) }]}>
            {getGradeText(percentage)}
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalQuestions - correctAnswers}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalQuestions}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Answers Review */}
        {resultData.submission.answers.length > 0 && (
          <View style={styles.answersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Answer Review</Text>
              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={() => setShowAllAnswers(!showAllAnswers)}
              >
                <Text style={styles.toggleButtonText}>
                  {showAllAnswers ? 'Show Summary' : 'Show All Answers'}
                </Text>
              </TouchableOpacity>
            </View>

            {showAllAnswers ? (
              // Show all answers with details
              <View style={styles.answersList}>
                {resultData.submission.answers.map((answer, index) => {
                  const question = resultData.exam.questions.find(q => q.id === answer.question_id);
                  return (
                    <View key={answer.question_id} style={styles.answerItem}>
                      <View style={styles.questionHeader}>
                        <Text style={styles.questionNumber}>Q{index + 1}</Text>
                        <View style={[
                          styles.correctBadge,
                          answer.is_correct ? styles.correct : styles.incorrect
                        ]}>
                          <Text style={styles.correctBadgeText}>
                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                          </Text>
                        </View>
                        <Text style={styles.pointsText}>{answer.points} pts</Text>
                      </View>
                      
                      {question && (
                        <>
                          <Text style={styles.questionText}>{question.question}</Text>
                          
                          {question.type === 'mcq' && (
                            <View style={styles.optionsReview}>
                              <Text style={styles.answerLabel}>Your answer:</Text>
                              <Text style={[
                                styles.answerText,
                                answer.is_correct ? styles.correctText : styles.incorrectText
                              ]}>
                                {answer.answer}
                              </Text>
                              
                              {!answer.is_correct && (
                                <>
                                  <Text style={styles.answerLabel}>Correct answer:</Text>
                                  <Text style={styles.correctAnswerText}>
                                    {question.correct_answer}
                                  </Text>
                                </>
                              )}
                            </View>
                          )}
                          
                          {question.type === 'text' && (
                            <View style={styles.textAnswerReview}>
                              <Text style={styles.answerLabel}>Your answer:</Text>
                              <Text style={styles.textAnswer}>{answer.answer}</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              // Show summary view
              <View style={styles.summaryView}>
                <View style={styles.correctAnswers}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  <Text style={styles.summaryText}>
                    {correctAnswers} questions correct
                  </Text>
                </View>
                <View style={styles.incorrectAnswers}>
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  <Text style={styles.summaryText}>
                    {totalQuestions - correctAnswers} questions incorrect
                  </Text>
                </View>
                <Text style={styles.summaryHint}>
                  Tap "Show All Answers" to review each question in detail
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/exams')}
          >
            <Ionicons name="list" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Back to Exams</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/')}
          >
            <Ionicons name="home" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  content: {
    flex: 1,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  examInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#007AFF',
    marginBottom: 16,
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  scoreText: {
    fontSize: 16,
    color: '#666',
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
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  answersSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
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
    color: '#1C1C1E',
  },
  toggleButton: {
    backgroundColor: '#007AFF',
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
    // Styles for detailed answers list
  },
  answerItem: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
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
    color: '#1C1C1E',
    marginRight: 8,
  },
  correctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  correct: {
    backgroundColor: '#34C75920',
  },
  incorrect: {
    backgroundColor: '#FF3B3020',
  },
  correctBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 'auto',
  },
  questionText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 12,
    lineHeight: 22,
  },
  optionsReview: {
    // Styles for MCQ review
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
    color: '#1C1C1E',
  },
  incorrectText: {
    backgroundColor: '#FF3B3020',
    color: '#1C1C1E',
  },
  correctAnswerText: {
    fontSize: 16,
    backgroundColor: '#34C75920',
    color: '#1C1C1E',
    padding: 8,
    borderRadius: 4,
  },
  textAnswerReview: {
    // Styles for text answer review
  },
  textAnswer: {
    fontSize: 16,
    backgroundColor: '#F8F8F8',
    color: '#1C1C1E',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  summaryView: {
    // Styles for summary view
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
    color: '#1C1C1E',
    marginLeft: 8,
  },
  summaryHint: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionButtons: {
    padding: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});