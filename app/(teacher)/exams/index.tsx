// app/(teacher)/exams/index.tsx - UPDATED
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import Alert from '@/components/Alert';
import { router } from "expo-router";
import { useAuth } from "../../../src/contexts/AuthContext";
import { apiService } from "../../../src/services/api";
import { Exam } from "../../../src/types";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../../src/contexts/ThemeContext";
import { designTokens } from "../../../src/utils/designTokens";
import { ShareModal } from "@/components/ShareModal";
import { generateExamLink } from "@/utils/linking";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t, isRTL } = useTranslation();
  const { fontFamily, colors } = useThemeContext();
  const { user, isAuthenticated } = useAuth();
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [allExams, setAllExams] = useState<TeacherExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "draft" | "archived">("active");
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentExam, setCurrentExam] = useState<TeacherExam | null>(null);

  const shareExam = (exam: TeacherExam) => {
    setCurrentExam(exam);
    setShowShareModal(true);
  };

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user?.role === 'student') {
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
      Alert.alert(t("common.error"), t("exams.loadFailed"));
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

  // NEW: Toggle exam active status
  const toggleExamStatus = async (examId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const response = await apiService.updateExamStatus(examId, { is_active: newStatus });

      if (response.data.success) {
        // Update local state
        setAllExams(prev => prev.map(exam =>
          exam.id === examId ? { ...exam, is_active: newStatus } : exam
        ));
        filterExamsByTab();

        Alert.alert(
          t('common.success'),
          t(newStatus ? 'exams.activatedSuccess' : 'exams.deactivatedSuccess')
        );
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error("Toggle exam status error:", error);
      Alert.alert(
        t('common.error'),
        t('exams.updateFailed')
      );
    }
  };

  const deleteExam = async (examId: string, examTitle: string) => {
    Alert.alert(
      t("common.confirm"),
      `${t("exams.deleteConfirm")} "${examTitle}"?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiService.deleteExam(examId);
              if (response.data.success) {
                setAllExams((prev) => prev.filter((exam) => exam.id !== examId));
                setExams((prev) => prev.filter((exam) => exam.id !== examId));
                Alert.alert(t("common.success"), t("exams.deleteSuccess"));
              } else {
                Alert.alert(t("common.error"), response.data.error || t("exams.deleteFailed"));
              }
            } catch (error) {
              console.error("Delete exam error:", error);
              Alert.alert(t("common.error"), t("exams.deleteFailed"));
            }
          }
        }
      ]
    );
  };

  const getStatusBadge = (exam: TeacherExam) => {
    if (exam.status === "draft" || exam.is_active === false) {
      return {
        text: t("exams.inactive"),
        color: colors.background,
        textColor: colors.textSecondary
      };
    }

    if (exam.status === "archived") {
      return {
        text: t("exams.archived"),
        color: colors.background,
        textColor: colors.textSecondary
      };
    }

    return {
      text: t("exams.active"),
      color: `${colors.success}15`,
      textColor: colors.success
    };
  };

  const getTabCounts = () => {
    const activeCount = allExams.filter((exam) =>
      exam.is_active !== false && exam.status !== "archived" && exam.status !== "draft"
    ).length;

    const draftCount = allExams.filter((exam) =>
      exam.is_active === false || exam.status === "draft"
    ).length;

    const archivedCount = allExams.filter((exam) =>
      exam.status === "archived"
    ).length;

    return { active: activeCount, draft: draftCount, archived: archivedCount };
  };

  const tabCounts = getTabCounts();

  const styles = {
    container: {
      flex: 1,
      paddingBottom: 40
    } as any,
    loadingText: {
      marginTop: designTokens.spacing.md,
      fontSize: designTokens.typography.body.fontSize,
      fontWeight: '500'
    } as any,
    header: {
      paddingHorizontal: designTokens.spacing.xl,
      paddingTop: designTokens.spacing.xxxl,
      paddingBottom: designTokens.spacing.lg,
      borderBottomWidth: 1
    } as any,
    headerContent: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: designTokens.spacing.xl
    } as any,
    headerTitle: {
      fontSize: designTokens.typography.title2.fontSize,
      fontWeight: designTokens.typography.title2.fontWeight as any,
      marginBottom: designTokens.spacing.xs
    } as any,
    headerSubtitle: {
      fontSize: designTokens.typography.body.fontSize,
      fontWeight: '500'
    } as any,
    newButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: designTokens.spacing.lg,
      paddingVertical: designTokens.spacing.sm,
      borderRadius: designTokens.borderRadius.lg,
      ...designTokens.shadows.sm
    } as any,
    newButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: designTokens.typography.body.fontSize,
      marginLeft: designTokens.spacing.xs
    } as any,
    tabsContainer: {
      flexDirection: 'row',
      borderRadius: designTokens.borderRadius.lg,
      padding: designTokens.spacing.xs
    } as any,
    tab: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: designTokens.spacing.md,
      borderRadius: designTokens.borderRadius.md
    } as any,
    tabText: {
      marginLeft: designTokens.spacing.xs,
      fontSize: designTokens.typography.footnote.fontSize,
      fontWeight: '600'
    } as any,
    tabBadge: {
      paddingHorizontal: designTokens.spacing.xs,
      paddingVertical: 2,
      borderRadius: designTokens.borderRadius.full,
      marginLeft: designTokens.spacing.xs
    } as any,
    tabBadgeText: {
      fontSize: designTokens.typography.caption2.fontSize,
      fontWeight: '600'
    } as any,
    content: {
      padding: designTokens.spacing.xl
    } as any,
    emptyState: {
      alignItems: 'center',
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.xxxl,
      borderWidth: 1
    } as any,
    emptyStateTitle: {
      fontSize: designTokens.typography.headline.fontSize,
      fontWeight: '500',
      marginTop: designTokens.spacing.lg,
      marginBottom: designTokens.spacing.xs
    } as any,
    emptyStateSubtitle: {
      fontSize: designTokens.typography.footnote.fontSize,
      textAlign: 'center',
      marginBottom: designTokens.spacing.lg
    } as any,
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: designTokens.spacing.xl,
      paddingVertical: designTokens.spacing.md,
      borderRadius: designTokens.borderRadius.lg
    } as any,
    createButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: designTokens.typography.body.fontSize,
      marginLeft: designTokens.spacing.xs
    } as any,
    examsList: {
      gap: designTokens.spacing.sm
    } as any,
    examCard: {
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.lg,
      borderWidth: 1
    } as any,
    examHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: designTokens.spacing.md
    } as any,
    examTextContainer: {
      flex: 1
    } as any,
    examTitle: {
      fontSize: designTokens.typography.headline.fontSize,
      fontWeight: '600',
      marginBottom: designTokens.spacing.xs
    } as any,
    examMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap' as 'wrap',
      gap: designTokens.spacing.md
    } as any,
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center'
    } as any,
    metaText: {
      fontSize: designTokens.typography.footnote.fontSize,
      fontWeight: '500',
      marginLeft: designTokens.spacing.xxs
    } as any,
    statusBadge: {
      paddingHorizontal: designTokens.spacing.sm,
      paddingVertical: designTokens.spacing.xxs,
      borderRadius: designTokens.borderRadius.full
    } as any,
    statusText: {
      fontSize: designTokens.typography.caption1.fontSize,
      fontWeight: '600'
    } as any,
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: designTokens.spacing.md
    } as any,
    statsContainer: {
      flexDirection: 'row',
      gap: designTokens.spacing.lg
    } as any,
    statItem: {
      flexDirection: 'row',
      alignItems: 'center'
    } as any,
    statText: {
      fontSize: designTokens.typography.footnote.fontSize,
      fontWeight: '500',
      marginLeft: designTokens.spacing.xxs
    } as any,
    dateText: {
      fontSize: designTokens.typography.caption1.fontSize
    } as any,
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    } as any,
    primaryActions: {
      flexDirection: 'row',
      gap: designTokens.spacing.sm
    } as any,
    secondaryActions: {
      flexDirection: 'row',
      gap: designTokens.spacing.sm
    } as any,
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: designTokens.spacing.md,
      paddingVertical: designTokens.spacing.sm,
      borderRadius: designTokens.borderRadius.lg
    } as any,
    actionText: {
      fontSize: designTokens.typography.footnote.fontSize,
      fontWeight: '600',
      marginLeft: designTokens.spacing.xs
    } as any,
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: designTokens.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center'
    } as any,
    statsGrid: {
      flexDirection: 'row',
      gap: designTokens.spacing.sm,
      marginTop: designTokens.spacing.xl
    } as any,
    statCard: {
      flex: 1,
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.md,
      borderWidth: 1,
      ...designTokens.shadows.sm
    } as any,
    statLabel: {
      fontSize: designTokens.typography.caption1.fontSize,
      fontWeight: '500',
      marginBottom: designTokens.spacing.xxs
    } as any,
    statValue: {
      fontSize: designTokens.typography.title2.fontSize,
      fontWeight: '700'
    } as any
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { fontFamily, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontFamily, color: colors.textSecondary }]}>
          {t("exams.loading")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
              {t("exams.myExams")}
            </Text>
            <Text style={[styles.headerSubtitle, { fontFamily, color: colors.textSecondary }]}>
              {allExams.length} {t("exams.totalExams")}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.newButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(teacher)/create-exam")}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.newButtonText}>{t("common.create")}</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.background }]}>
          {[
            { key: "active", label: t("common.active"), icon: "play", count: tabCounts.active },
            { key: "draft", label: t("exams.drafts"), icon: "document", count: tabCounts.draft },
            { key: "archived", label: t("exams.archived"), icon: "archive", count: tabCounts.archived }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && {
                  backgroundColor: colors.backgroundElevated,
                  ...designTokens.shadows.sm
                }
              ]}
              onPress={() => setActiveTab(tab.key as any)}
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
                    ? { fontFamily, color: colors.primary }
                    : { fontFamily, color: colors.textSecondary }
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
                      ? { fontFamily, color: colors.primary }
                      : { fontFamily, color: colors.textSecondary }
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
            <Text style={[styles.emptyStateTitle, { fontFamily, color: colors.textSecondary }]}>
              {activeTab === "active" && t("exams.noActiveExams")}
              {activeTab === "draft" && t("exams.noDraftExams")}
              {activeTab === "archived" && t("exams.noArchivedExams")}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { fontFamily, color: colors.textTertiary }]}>
              {activeTab === "active" && allExams.length > 0
                ? t("exams.allInDraftOrArchived")
                : t("exams.createFirstExam")}
            </Text>
            {activeTab === "active" && allExams.length === 0 && (
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(teacher)/create-exam")}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>{t("exams.create")}</Text>
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
                      <Text style={[styles.examTitle, { fontFamily, color: colors.textPrimary }]}>
                        {exam.title}
                      </Text>
                      <View style={styles.examMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="book" size={14} color={colors.textTertiary} />
                          <Text style={[styles.metaText, { fontFamily, color: colors.textSecondary }]}>
                            {exam.subject}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="people" size={14} color={colors.textTertiary} />
                          <Text style={[styles.metaText, { fontFamily, color: colors.textSecondary }]}>
                            {exam.class}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="time" size={14} color={colors.textTertiary} />
                          <Text style={[styles.metaText, { fontFamily, color: colors.textSecondary }]}>
                            {exam.settings?.timed ? `${exam.settings.duration}m` : t("exams.untimed")}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
                      <Text style={[styles.statusText, { fontFamily, color: statusBadge.textColor }]}>
                        {statusBadge.text}
                      </Text>
                    </View>
                  </View>

                  {/* Stats Row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statsContainer}>
                      <View style={styles.statItem}>
                        <Ionicons name="person" size={16} color={colors.primary} />
                        <Text style={[styles.statText, { fontFamily, color: colors.textPrimary }]}>
                          {exam.submissions_count || 0} {t("submissions.submitted")}
                        </Text>
                      </View>
                      {exam.average_score !== undefined && exam.average_score > 0 && (
                        <View style={styles.statItem}>
                          <Ionicons name="trophy" size={16} color={colors.warning} />
                          <Text style={[styles.statText, { fontFamily, color: colors.textPrimary }]}>
                            {exam.average_score}% {t("dashboard.avgScore")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.dateText, { fontFamily, color: colors.textTertiary }]}>
                      {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : t("common.unknown")}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    <View style={styles.primaryActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]}
                        onPress={() => router.push(`/(teacher)/exams/${exam.id}`)}
                      >
                        <Ionicons name="eye" size={16} color={colors.primary} />
                        <Text style={[styles.actionText, { fontFamily, color: colors.primary }]}>
                          {t("common.view")}
                        </Text>
                      </TouchableOpacity>

                      {(exam.submissions_count || 0) > 0 && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: `${colors.success}15` }]}
                          onPress={() => router.push(`/(teacher)/exam-results/${exam.id}`)}
                        >
                          <Ionicons name="bar-chart" size={16} color={colors.success} />
                          <Text style={[styles.actionText, { fontFamily, color: colors.success }]}>
                            {t("submissions.title")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.secondaryActions}>
                      {/* NEW: Toggle Status Button */}
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.background }]}
                        onPress={() => toggleExamStatus(exam.id, exam.is_active !== false)}
                      >
                        <Ionicons
                          name={exam.is_active !== false ? "pause" : "play"}
                          size={18}
                          color={exam.is_active !== false ? colors.warning : colors.success}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.background }]}
                        onPress={() => {
                          if (exam) {
                            setCurrentExam(exam);
                            setShowShareModal(true);
                          }
                        }}
                      >
                        <Ionicons name="share" size={18} color={colors.textSecondary} />
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
              <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>{t("exams.showing")}</Text>
              <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>{exams.length}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>{t("submissions.title")}</Text>
              <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                {exams.reduce((sum, exam) => sum + (exam.submissions_count || 0), 0)}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>{t("common.active")}</Text>
              <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
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
          title={`${t("exams.exam")}: ${currentExam.title}`}
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