// app/(teacher)/exams-teacher/index.tsx - REDESIGNED
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Alert from "@blazejkustra/react-native-alert";
import { router } from "expo-router";
import { useAuth } from "../../../src/contexts/AuthContext";
import { apiService } from "../../../src/services/api";
import { Exam } from "../../../src/types";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../../src/contexts/ThemeContext";
import { designTokens } from "../../../src/utils/designTokens";
import { ShareModal } from "@/components/ShareModal";
import { generateExamLink } from "@/utils/linking";

// Extended Exam type with optional fields for teacher view
interface TeacherExam extends Exam {
  submissions_count?: number;
  average_score?: number;
  teacher?: {
    id: string;
    profile: {
      name: string;
    };
  };
}

export default function TeacherExamsScreen() {
  const { colors } = useThemeContext();
  const { user, isAuthenticated } = useAuth();
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [allExams, setAllExams] = useState<TeacherExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "draft" | "archived">("active");
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentExam, setCurrentExam] = useState<TeacherExam | null>(null);

  // Add share function
  const shareExam = (exam: TeacherExam) => {
    setCurrentExam(exam);
    setShowShareModal(true);
  };

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user?.role === 'student') {
        console.log('➡️ Redirecting student to tabs');
        router.replace('/(student)/homework');
      }
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    filterExamsByTab();
  }, [activeTab, allExams]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTeacherExams();

      if (response.data.success) {
        const examsData: TeacherExam[] = response.data.data || [];
        setAllExams(examsData);
        filterExamsByTab(examsData);
      } else {
        setAllExams([]);
        setExams([]);
      }
    } catch (error: any) {
      console.error("Failed to load exams:", error);
      Alert.alert("Error", "Failed to load exams. Please check your connection.");
      setAllExams([]);
      setExams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterExamsByTab = (examsData = allExams) => {
    const filtered = examsData.filter((exam) => {
      switch (activeTab) {
        case "active":
          return exam.is_active !== false && exam.status !== "archived" && exam.status !== "draft";
        case "draft":
          return exam.is_active === false || exam.status === "draft";
        case "archived":
          return exam.status === "archived";
        default:
          return true;
      }
    });

    setExams(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExams();
  };

  const deleteExam = async (examId: string, examTitle: string) => {
    Alert.alert(
      "Delete Exam",
      `Are you sure you want to delete "${examTitle}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiService.deleteExam(examId);
              if (response.data.success) {
                setAllExams(prev => prev.filter((exam) => exam.id !== examId));
                setExams(prev => prev.filter((exam) => exam.id !== examId));
                Alert.alert("Success", "Exam deleted successfully");
              } else {
                Alert.alert("Error", response.data.error || "Failed to delete exam");
              }
            } catch (error) {
              console.error("Delete exam error:", error);
              Alert.alert("Error", "Failed to delete exam");
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (exam: TeacherExam) => {
    if (exam.status === "draft" || exam.is_active === false) {
      return {
        text: "Draft",
        color: colors.background,
        textColor: colors.textSecondary
      };
    }

    if (exam.status === "archived") {
      return {
        text: "Archived",
        color: colors.background,
        textColor: colors.textSecondary
      };
    }

    return {
      text: "Active",
      color: `${colors.success}15`,
      textColor: colors.success
    };
  };

  const getTabCounts = () => {
    const activeCount = allExams.filter(exam =>
      exam.is_active !== false && exam.status !== "archived" && exam.status !== "draft"
    ).length;

    const draftCount = allExams.filter(exam =>
      exam.is_active === false || exam.status === "draft"
    ).length;

    const archivedCount = allExams.filter(exam =>
      exam.status === "archived"
    ).length;

    return { active: activeCount, draft: draftCount, archived: archivedCount };
  };

  const tabCounts = getTabCounts();

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading exams...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Exams</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {allExams.length} total exams
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.newButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(teacher)/create-exam")}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.newButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.background }]}>
          {[
            { key: "active" as const, label: "Active", icon: "play", count: tabCounts.active },
            { key: "draft" as const, label: "Drafts", icon: "document", count: tabCounts.draft },
            { key: "archived" as const, label: "Archived", icon: "archive", count: tabCounts.archived },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key
                  ? { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.sm }
                  : {}
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? colors.primary : colors.textTertiary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key
                    ? { color: colors.primary }
                    : { color: colors.textSecondary }
                ]}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[
                  styles.tabBadge,
                  activeTab === tab.key
                    ? { backgroundColor: `${colors.primary}15` }
                    : { backgroundColor: colors.background }
                ]}>
                  <Text style={[
                    styles.tabBadgeText,
                    activeTab === tab.key
                      ? { color: colors.primary }
                      : { color: colors.textSecondary }
                  ]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Exams List */}
      <View style={styles.content}>
        {exams.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
            <Ionicons
              name={
                activeTab === "active" ? "document-text-outline" :
                  activeTab === "draft" ? "create-outline" : "archive-outline"
              }
              size={64}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyStateTitle, { color: colors.textSecondary }]}>
              {activeTab === "active" && "No active exams"}
              {activeTab === "draft" && "No draft exams"}
              {activeTab === "archived" && "No archived exams"}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: colors.textTertiary }]}>
              {activeTab === "active" && allExams.length > 0
                ? "All exams are in draft or archived status"
                : "Create your first exam to get started"}
            </Text>
            {activeTab === "active" && allExams.length === 0 && (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(teacher)/create-exam")}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Exam</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.examsList}>
            {exams.map((exam) => {
              const statusBadge = getStatusBadge(exam);

              return (
                <View
                  key={exam.id}
                  style={[styles.examCard, {
                    backgroundColor: colors.backgroundElevated,
                    borderColor: colors.border,
                    ...designTokens.shadows.sm
                  }]}
                >
                  <View style={styles.examHeader}>
                    <View style={styles.examTextContainer}>
                      <Text style={[styles.examTitle, { color: colors.textPrimary }]}>
                        {exam.title}
                      </Text>
                      <View style={styles.examMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="book" size={14} color={colors.textTertiary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {exam.subject}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="people" size={14} color={colors.textTertiary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {exam.class}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="time" size={14} color={colors.textTertiary} />
                          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {exam.settings?.timed ? `${exam.settings.duration}m` : "Untimed"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
                      <Text style={[styles.statusText, { color: statusBadge.textColor }]}>
                        {statusBadge.text}
                      </Text>
                    </View>
                  </View>

                  {/* Stats Row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Ionicons name="person" size={16} color={colors.primary} />
                        <Text style={[styles.statText, { color: colors.textPrimary }]}>
                          {exam.submissions_count || 0} submissions
                        </Text>
                      </View>
                      {exam.average_score !== undefined && exam.average_score > 0 && (
                        <View style={styles.statItem}>
                          <Ionicons name="trophy" size={16} color={colors.warning} />
                          <Text style={[styles.statText, { color: colors.textPrimary }]}>
                            {exam.average_score}% avg
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                      {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : "Unknown"}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    <View style={styles.primaryActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]}
                        onPress={() => router.push(`/(teacher)/exams-teacher/${exam.id}`)}
                      >
                        <Ionicons name="eye" size={16} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>
                          View
                        </Text>
                      </TouchableOpacity>

                      {(exam.submissions_count || 0) > 0 && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: `${colors.success}15` }]}
                          onPress={() => router.push(`/(teacher)/exam-results/${exam.id}`)}
                        >
                          <Ionicons name="bar-chart" size={16} color={colors.success} />
                          <Text style={[styles.actionText, { color: colors.success }]}>
                            Results
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.secondaryActions}>
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.background }]}
                        onPress={() => {
                          if (exam) {
                            setCurrentExam(exam);
                            setShowShareModal(true);
                          }
                        }}
                      >
                        <Ionicons name="share" size={18} color={colors.textTertiary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: `${colors.error}15` }]}
                        onPress={() => deleteExam(exam.id, exam.title)}
                      >
                        <Ionicons name="trash" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Stats */}
        {exams.length > 0 && (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Showing</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{exams.length}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Submissions</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {exams.reduce((sum, exam) => sum + (exam.submissions_count || 0), 0)}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {tabCounts.active}
              </Text>
            </View>
          </View>
        )}
      </View>
      {currentExam && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={`Exam: ${currentExam.title}`}
          link={generateExamLink(
            currentExam.id,
            { subject: currentExam.subject, title: currentExam.title }
          )}
          subject={currentExam.subject}
        />
      )}
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xl,
  },
  headerTitle: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
    marginBottom: designTokens.spacing.xs,
  },
  headerSubtitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    ...designTokens.shadows.sm,
  },
  newButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize,
    marginLeft: designTokens.spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md,
  },
  tabText: {
    marginLeft: designTokens.spacing.xs,
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: designTokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: designTokens.borderRadius.full,
    marginLeft: designTokens.spacing.xs,
  },
  tabBadgeText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600',
  },
  content: {
    padding: designTokens.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.xxxl,
    borderWidth: 1,
  },
  emptyStateTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.xs,
  },
  emptyStateSubtitle: {
    fontSize: designTokens.typography.footnote.fontSize,
    textAlign: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.xl,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize,
    marginLeft: designTokens.spacing.xs,
  },
  examsList: {
    gap: designTokens.spacing.sm,
  },
  examCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.md,
  },
  examTextContainer: {
    flex: 1,
  },
  examTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs,
  },
  examMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap' as 'wrap',
    gap: designTokens.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '500',
    marginLeft: designTokens.spacing.xxs,
  },
  statusBadge: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xxs,
    borderRadius: designTokens.borderRadius.full,
  },
  statusText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: designTokens.spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '500',
    marginLeft: designTokens.spacing.xxs,
  },
  dateText: {
    fontSize: designTokens.typography.caption1.fontSize,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
  },
  actionText: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600',
    marginLeft: designTokens.spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.md,
    borderWidth: 1,
    ...designTokens.shadows.sm,
  },
  statLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    marginBottom: designTokens.spacing.xxs,
  },
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: '700',
  },
};
