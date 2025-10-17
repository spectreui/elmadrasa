// app/(teacher)/homework/[id].tsx - iOS-like Homework Detail Page with Liquid Glass Design
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiService } from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '@/src/utils/designTokens';
import { useTranslation } from "@/hooks/useTranslation";
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

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
  questions: any[];
  teacher_id: string;
  created_at: string;
  updated_at: string;
  submissions_count?: number;
  graded_count?: number;
  average_score?: number;
  teacher?: {
    profile: {
      name: string;
    };
  };
}

export default function HomeworkDetailScreen() {
  const { t, isRTL } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { fontFamily, colors } = useThemeContext();

  const loadHomework = async () => {
    try {
      setLoading(true);
      const response = await apiService.getHomeworkById(id);

      if (response.data.success) {
        setHomework(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to load homework');
      }
    } catch (error: any) {
      console.error('Failed to load homework:', error);
      Alert.alert('Error', error.message || 'Failed to load homework details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHomework();
  };

  const handleEdit = () => {
    setIsEditing(true);
    router.push({
      pathname: '/homework/edit/[id]',
      params: { id }
    });
  };

  const handleViewSubmissions = () => {
    router.push({
      pathname: '/homework/[id]/submissions',
      params: { id }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = () => {
    if (!homework) return { text: '', color: colors.textSecondary };
    
    const dueDate = new Date(homework.due_date);
    const now = new Date();
    
    if (dueDate < now) {
      return { text: 'Overdue', color: colors.error };
    }
    
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      return { text: 'Due Soon', color: colors.warning };
    }
    
    return { text: 'Active', color: colors.success };
  };

  if (loading) {
    return (
      <View style={[styles.container, { fontFamily, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons 
              name={isRTL ? "arrow-forward" : "arrow-back"} 
              size={28} 
              color={colors.textPrimary} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
            Homework
          </Text>
          <View style={{ width: 28 }} /> {/* Spacer for alignment */}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { fontFamily, color: colors.textSecondary }]}>
            {t("common.loading")}
          </Text>
        </View>
      </View>
    );
  }

  if (!homework) {
    return (
      <View style={[styles.container, { fontFamily, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons 
              name={isRTL ? "arrow-forward" : "arrow-back"} 
              size={28} 
              color={colors.textPrimary} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
            {t("homework.title")}
          </Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyStateTitle, { fontFamily, color: colors.textPrimary }]}>
            Homework Not Found
          </Text>
          <Text style={[styles.emptyStateSubtitle, { fontFamily, color: colors.textSecondary }]}>
            The homework assignment could not be found
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <View style={[styles.container, { fontFamily, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons 
            name={isRTL ? "arrow-forward" : "arrow-back"} 
            size={28} 
            color={colors.textPrimary} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
          Homework
        </Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEdit}
        >
          <Ionicons name="pencil" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Liquid Glass Header Card */}
        <View style={styles.headerCardContainer}>
          <BlurView 
            intensity={ Platform.OS === 'ios' ? 80 : 60 } 
            tint="light"
            style={styles.headerCardBlur}
          >
            <View style={[styles.headerCard, { backgroundColor: `${colors.primary}15` }]}>
              <View style={styles.headerCardTop}>
                <Text style={[styles.homeworkTitle, { fontFamily, color: colors.textPrimary }]}>
                  {homework.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
                  <Text style={[styles.statusText, { fontFamily, color: statusInfo.color }]}>
                    {statusInfo.text}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.homeworkDescription, { fontFamily, color: colors.textSecondary }]}>
                {homework.description}
              </Text>
              
              <View style={[styles.tagContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.tag, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.tagText, { fontFamily, color: colors.primary }]}>
                    {homework.subject}
                  </Text>
                </View>
                <View style={[styles.tag, { backgroundColor: `${colors.accentSecondary}20` }]}>
                  <Text style={[styles.tagText, { fontFamily, color: colors.accentSecondary }]}>
                    {homework.class}
                  </Text>
                </View>
                <View style={[styles.tag, { backgroundColor: `${colors.textTertiary}20` }]}>
                  <Text style={[styles.tagText, { fontFamily, color: colors.textSecondary }]}>
                    {homework.points} pts
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCardsContainer}>
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundElevated }]}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.infoCardTitle, { fontFamily, color: colors.textPrimary }]}>
                Due Date
              </Text>
            </View>
            <Text style={[styles.infoCardValue, { fontFamily, color: colors.textPrimary }]}>
              {formatDate(homework.due_date)}
            </Text>
            <Text style={[styles.infoCardSubtitle, { fontFamily, color: colors.textSecondary }]}>
              {formatTime(homework.due_date)}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.backgroundElevated }]}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="time" size={20} color={colors.accentSecondary} />
              <Text style={[styles.infoCardTitle, { fontFamily, color: colors.textPrimary }]}>
                Start Date
              </Text>
            </View>
            <Text style={[styles.infoCardValue, { fontFamily, color: colors.textPrimary }]}>
              {formatDate(homework.start_date)}
            </Text>
            <Text style={[styles.infoCardSubtitle, { fontFamily, color: colors.textSecondary }]}>
              {formatTime(homework.start_date)}
            </Text>
          </View>
        </View>

        {/* Questions Section */}
        {homework.allow_questions && homework.questions && homework.questions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary }]}>
              Questions
            </Text>
            <View style={[styles.questionsCard, { backgroundColor: colors.backgroundElevated }]}>
              {homework.questions.map((question, index) => (
                <View 
                  key={question.id} 
                  style={[
                    styles.questionItem,
                    index !== homework.questions.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border
                    }
                  ]}
                >
                  <View style={styles.questionHeader}>
                    <Text style={[styles.questionNumber, { fontFamily, color: colors.primary }]}>
                      {index + 1}.
                    </Text>
                    <Text style={[styles.questionText, { fontFamily, color: colors.textPrimary }]}>
                      {question.question}
                    </Text>
                  </View>
                  <View style={styles.questionFooter}>
                    <Text style={[styles.questionPoints, { fontFamily, color: colors.textSecondary }]}>
                      {question.points} points
                    </Text>
                    {question.type === 'mcq' && (
                      <View style={styles.optionsContainer}>
                        {question.options.map((option: string, optIndex: number) => (
                          <View key={optIndex} style={styles.optionItem}>
                            <Text style={[styles.optionText, { fontFamily, color: colors.textSecondary }]}>
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary }]}>
            Statistics
          </Text>
          <View style={[styles.statsCard, { backgroundColor: colors.backgroundElevated }]}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                  {homework.submissions_count || 0}
                </Text>
                <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>
                  Submissions
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                  {homework.graded_count || 0}
                </Text>
                <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>
                  Graded
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { fontFamily, color: colors.success }]}>
                  {homework.average_score || 0}%
                </Text>
                <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>
                  Avg Score
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.backgroundElevated }]}
            onPress={() => router.push(`/homework/${homework.id}/submissions`)}
          >
            <Ionicons name="people" size={20} color={colors.primary} />
            <Text style={[styles.actionButtonText, { fontFamily, color: colors.textPrimary }]}>
              View Submissions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleViewSubmissions}
          >
            <Ionicons name="eye" size={20} color="white" />
            <Text style={[styles.actionButtonText, { fontFamily, color: 'white' }]}>
              Grade Submissions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    paddingBottom: 40
  } as any,
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as any,
  backButton: {
    padding: 4,
    borderRadius: 20,
  } as any,
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  } as any,
  editButton: {
    padding: 6,
    borderRadius: 20,
  } as any,
  scrollView: {
    flex: 1,
  } as any,
  contentContainer: {
    paddingBottom: 40,
  } as any,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  } as any,
  loadingText: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '500',
  } as any,
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  } as any,
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  } as any,
  emptyStateSubtitle: {
    fontSize: 17,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
    marginBottom: 24,
  } as any,
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as any,
  retryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  } as any,
  headerCardContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...designTokens.shadows.lg,
  } as any,
  headerCardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  } as any,
  headerCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  } as any,
  headerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  } as any,
  homeworkTitle: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.3,
  } as any,
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  } as any,
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as any,
  homeworkDescription: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.9,
  } as any,
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap' as 'wrap',
    gap: 8,
  } as any,
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  } as any,
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  } as any,
  infoCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 16,
  } as any,
  infoCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    ...designTokens.shadows.sm,
  } as any,
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  } as any,
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  } as any,
  infoCardValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  } as any,
  infoCardSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.7,
  } as any,
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  } as any,
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.2,
  } as any,
  questionsCard: {
    borderRadius: 16,
    padding: 20,
    ...designTokens.shadows.sm,
  } as any,
  questionItem: {
    paddingVertical: 16,
  } as any,
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  } as any,
  questionNumber: {
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
  } as any,
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  } as any,
  questionFooter: {
    marginLeft: 25,
  } as any,
  questionPoints: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  } as any,
  optionsContainer: {
    gap: 6,
  } as any,
  optionItem: {
    paddingVertical: 4,
  } as any,
  optionText: {
    fontSize: 15,
    opacity: 0.9,
  } as any,
  statsCard: {
    borderRadius: 16,
    padding: 20,
    ...designTokens.shadows.sm,
  } as any,
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as any,
  statItem: {
    alignItems: 'center',
    flex: 1,
  } as any,
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  } as any,
  statLabel: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.7,
  } as any,
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 16,
  } as any,
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    ...designTokens.shadows.sm,
  } as any,
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  } as any,
  bottomSpacing: {
    height: 20,
  } as any,
};
