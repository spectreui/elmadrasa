// app/(student)/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl} from
"react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { designTokens } from "../../src/utils/designTokens";
import { useThemeContext } from "../../src/contexts/ThemeContext";
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';import { useTranslation } from "@/hooks/useTranslation";

export default function StudentDashboard() {const { t } = useTranslation();
  const { user } = useAuth();
  const { isDark, colors, fontFamily, toggleTheme } = useThemeContext();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load real data from API
      const [statsResponse, examsResponse] = await Promise.all([
      apiService.getStudentDashboard(),
      apiService.getUpcomingExams()]
      );

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (examsResponse.data.success) {
        setUpcomingExams(examsResponse.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const StatCard = ({ title, value, icon, color, index





  }: {title: string;value: string | number;icon: string;color: string;index: number; // Add this prop
  }) => <Animated.View
    entering={FadeInUp.delay(index * 100)} // Each card appears with delay
    style={{
      backgroundColor: colors.backgroundElevated,
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.lg,
      ...designTokens.shadows.md,
      flex: 1,
      marginHorizontal: designTokens.spacing.xs
    }}>

      <View style={{
      width: 44,
      height: 44,
      borderRadius: designTokens.borderRadius.full,
      backgroundColor: `${color}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: designTokens.spacing.sm
    }}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text
      style={{
        fontSize: designTokens.typography.title2.fontSize,
        fontWeight: designTokens.typography.title2.fontWeight,
        color: colors.textPrimary,
        marginBottom: 2
      } as any}>

        {value}
      </Text>
      <Text
      style={{
        fontSize: designTokens.typography.footnote.fontSize,
        color: colors.textTertiary
      }}>

        {title}
      </Text>
    </Animated.View>;


  const QuickAction = ({ title, icon, onPress, color




  }: {title: string;icon: string;onPress: () => void;color: string;}) =>
  <TouchableOpacity
    onPress={onPress}
    style={{
      backgroundColor: colors.backgroundElevated,
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.lg,
      ...designTokens.shadows.sm,
      flex: 1,
      marginHorizontal: designTokens.spacing.xs,
      alignItems: 'center'
    }}>

      <View
      style={{
        width: 50,
        height: 50,
        borderRadius: designTokens.borderRadius.full,
        backgroundColor: `${color}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: designTokens.spacing.sm
      }}>

        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text
      style={{
        fontSize: designTokens.typography.footnote.fontSize,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center'
      }}>

        {title}
      </Text>
    </TouchableOpacity>;


  const UpcomingExamCard = ({ exam }: {exam: any;}) =>
  <TouchableOpacity
    onPress={() => router.push(`/exam/${exam.id}`)}
    style={{
      backgroundColor: colors.backgroundElevated,
      borderRadius: designTokens.borderRadius.xl,
      padding: designTokens.spacing.lg,
      ...designTokens.shadows.sm,
      marginBottom: designTokens.spacing.sm
    }}>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#007AFF15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: designTokens.spacing.md
      }}>
          <Ionicons name="document-text" size={20} color="#007AFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
          style={{
            fontSize: designTokens.typography.headline.fontSize,
            fontWeight: designTokens.typography.headline.fontWeight,
            color: colors.textPrimary,
            marginBottom: 2
          } as any}
          numberOfLines={1}>

            {exam.title}
          </Text>
          <Text
          style={{
            fontSize: designTokens.typography.footnote.fontSize,
            color: colors.textSecondary
          }}>

            {exam.subject} • Due {new Date(exam.due_date).toLocaleDateString()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>;


  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center'
        }}>

        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            marginTop: designTokens.spacing.md,
            fontSize: designTokens.typography.body.fontSize,
            color: colors.textSecondary
          }}>{t("dashboard.loading")}


        </Text>
      </View>);

  }

  return (
    <Animated.ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      entering={FadeIn.duration(600)} // Smooth fade-in when screen loads
      refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.primary} />

      }>

      {/* Header */}
      <View style={{
        padding: designTokens.spacing.xl,
        paddingTop: designTokens.spacing.xxxl
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: designTokens.spacing.md
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#007AFF15',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: designTokens.spacing.md
            }}>
              <Text style={{ fontFamily, 
                fontSize: 24,
                fontWeight: '700',
                color: '#007AFF'
              }}>
                {user?.profile?.name?.charAt(0) || 'S'}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  fontSize: designTokens.typography.title1.fontSize,
                  fontWeight: designTokens.typography.title1.fontWeight,
                  color: colors.textPrimary
                } as any}>

                Welcome back,
              </Text>
              <Text
                style={{
                  fontSize: designTokens.typography.title2.fontSize,
                  fontWeight: designTokens.typography.title2.fontWeight,
                  color: colors.textPrimary
                } as any}>

                {user?.profile?.name || 'Student'}
              </Text>
              <Text
                style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  color: colors.textSecondary,
                  marginTop: 2
                }}>

                {user?.profile?.class ? `Class ${user.profile.class}` : 'No class assigned'}
              </Text>
            </View>
          </View>

          {/* Dark Mode Toggle */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={{
              padding: designTokens.spacing.sm,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: colors.backgroundElevated,
              ...designTokens.shadows.sm
            }}>

            <Ionicons
              name={isDark ? "sunny" : "moon"}
              size={24}
              color={colors.textPrimary} />

          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={{
          flexDirection: 'row',
          marginHorizontal: -designTokens.spacing.xs,
          marginBottom: designTokens.spacing.xl
        }}>
          <StatCard
            title="Average Score"
            value={stats?.averageScore ? `${stats.averageScore}%` : '--%'}
            icon="trending-up"
            color="#34C759"
            index={0} />

          <StatCard
            title="Exams Taken"
            value={stats?.examsCompleted || 0}
            icon="checkmark-circle"
            color="#007AFF"
            index={1} />

        </View>

        <View style={{
          flexDirection: 'row',
          marginHorizontal: -designTokens.spacing.xs,
          marginBottom: designTokens.spacing.xxl
        }}>
          <StatCard
            title="Upcoming Exams"
            value={stats?.upcomingExams || 0}
            icon="calendar"
            color="#FF9500"
            index={2} />

          <StatCard
            title="Pending Homework"
            value={stats?.pendingHomework || 0}
            icon="book"
            color="#AF52DE"
            index={3} />

        </View>
      </View>

      {/* Quick Actions */}
      <View style={{
        paddingHorizontal: designTokens.spacing.xl,
        marginBottom: designTokens.spacing.xl
      }}>
        <Text
          style={{
            fontSize: designTokens.typography.title3.fontSize,
            fontWeight: designTokens.typography.title3.fontWeight,
            color: colors.textPrimary,
            marginBottom: designTokens.spacing.md
          } as any}>{t("dashboard.quickActions")}


        </Text>
        <View style={{
          flexDirection: 'row',
          marginHorizontal: -designTokens.spacing.xs
        }}>
          <QuickAction
            title="Take Exam"
            icon="play-circle"
            onPress={() => router.push("/(student)/exams")}
            color="#007AFF" />

          <QuickAction
            title="Homework"
            icon="book"
            onPress={() => router.push("/(student)/homework")}
            color="#34C759" />

          <QuickAction
            title="Results"
            icon="bar-chart"
            onPress={() => router.push("/(student)/results")}
            color="#FF9500" />

        </View>
      </View>

      {/* Upcoming Exams */}
      <View style={{
        paddingHorizontal: designTokens.spacing.xl,
        marginBottom: designTokens.spacing.xxxl
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: designTokens.spacing.md
        }}>
          <Text
            style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary
            } as any}>

            Upcoming Exams
          </Text>
          <TouchableOpacity onPress={() => router.push("/(student)/exams")}>
            <Text
              style={{
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.primary,
                fontWeight: '600'
              }}>{t("common.viewAll")}


            </Text>
          </TouchableOpacity>
        </View>

        {upcomingExams.length === 0 ?
        <View
          style={{
            backgroundColor: colors.backgroundElevated,
            borderRadius: designTokens.borderRadius.xl,
            padding: designTokens.spacing.xl,
            alignItems: 'center',
            ...designTokens.shadows.sm
          }}>

            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text
            style={{
              fontSize: designTokens.typography.headline.fontSize,
              color: colors.textSecondary,
              marginTop: designTokens.spacing.md,
              marginBottom: designTokens.spacing.xs
            }}>

              No upcoming exams
            </Text>
            <Text
            style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textTertiary,
              textAlign: 'center'
            }}>

              You&apos;re all caught up for now
            </Text>
          </View> :

        upcomingExams.slice(0, 3).map((exam) =>
        <UpcomingExamCard key={exam.id} exam={exam} />
        )
        }
      </View>
    </Animated.ScrollView>);

}