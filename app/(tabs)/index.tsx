import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Exam, StudentStats } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";
import { handleApiError, showErrorAlert } from "../../src/utils/errorHandler";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    averageScore: 0,
    examsCompleted: 0,
    upcomingExams: 0,
    totalPoints: 0,
    rank: 0,
    improvement: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      console.log("🔄 Loading real dashboard data...");

      // Use Promise.all to load data in parallel
      const [statsResponse, examsResponse] = await Promise.all([
        apiService.getStudentStats(),
        apiService.getExams()
      ]);

      console.log("📊 Stats response:", statsResponse.data);
      console.log("📝 Exams response:", examsResponse.data);

      // Handle stats response
      if (statsResponse.data.success) {
        const statsData = statsResponse.data.data;
        setStats({
          averageScore: statsData.averageScore || 0,
          examsCompleted: statsData.examsCompleted || 0,
          upcomingExams: statsData.upcomingExams || 0,
          totalPoints: statsData.totalPoints || 0,
          rank: statsData.rank || 0,
          improvement: statsData.improvement || 0
        });
      } else {
        throw new Error(statsResponse.data.error || 'Failed to load statistics');
      }

      // Handle exams response
      if (examsResponse.data.success) {
        const allExams: Exam[] = examsResponse.data.data || [];
        
        // Filter for upcoming exams (active exams that student hasn't taken)
        const upcoming = allExams
          .filter(exam => exam.is_active === true)
          .slice(0, 3);
        
        setUpcomingExams(upcoming);
      } else {
        throw new Error(examsResponse.data.error || 'Failed to load exams');
      }

      setLastUpdated(new Date());

    } catch (error: any) {
      console.error("❌ Failed to load dashboard data:", error);
      showErrorAlert(error, "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return "text-green-600";
    if (improvement < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return "trending-up";
    if (improvement < 0) return "trending-down";
    return "remove";
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    return `Last updated: ${date.toLocaleTimeString()}`;
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4 text-base">
          Loading your dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900">
            Welcome back
          </Text>
          <Text className="text-gray-600 mt-2 text-base">
            {user?.profile.name} • {user?.profile.class} • {user?.student_id}
          </Text>
          {lastUpdated && (
            <Text className="text-gray-400 text-xs mt-1">
              {formatLastUpdated(lastUpdated)}
            </Text>
          )}
        </View>

        {/* Stats Grid */}
        <View className="grid grid-cols-2 gap-4 mb-8">
          {/* Average Score */}
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 text-sm font-medium">
                Average
              </Text>
              <Ionicons name="trending-up" size={20} color="#3b82f6" />
            </View>
            <Text
              className={`text-2xl font-bold ${getGradeColor(stats.averageScore)}`}
            >
              {stats.averageScore}%
            </Text>
            {stats.improvement && stats.improvement !== 0 && (
              <View className="flex-row items-center mt-1">
                <Ionicons 
                  name={getImprovementIcon(stats.improvement)} 
                  size={16} 
                  color={getImprovementColor(stats.improvement)} 
                />
                <Text className={`text-xs ${getImprovementColor(stats.improvement)} ml-1`}>
                  {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                </Text>
              </View>
            )}
          </View>

          {/* Completed Exams */}
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 text-sm font-medium">
                Completed
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {stats.examsCompleted}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">Exams taken</Text>
          </View>

          {/* Upcoming Exams */}
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 text-sm font-medium">
                Upcoming
              </Text>
              <Ionicons name="calendar" size={20} color="#f59e0b" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {stats.upcomingExams}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">Scheduled exams</Text>
          </View>

          {/* Rank */}
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 text-sm font-medium">Rank</Text>
              <Ionicons name="trophy" size={20} color="#8b5cf6" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              #{stats.rank || "N/A"}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">In class</Text>
          </View>
        </View>

        {/* Upcoming Exams Section */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-gray-900">
              Upcoming Exams
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/exams")}
              className="flex-row items-center"
            >
              <Text className="text-blue-600 text-sm font-medium mr-1">
                View all
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {upcomingExams.length === 0 ? (
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-8 items-center border border-gray-200">
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#d1d5db"
              />
              <Text className="text-gray-500 text-lg mt-4 font-medium">
                No upcoming exams
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                You're all caught up for now
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {upcomingExams.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 shadow-sm active:bg-gray-50"
                  onPress={() => router.push(`/exam/${exam.id}`)}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900 mb-1">
                        {exam.title}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {exam.subject} • {exam.class}
                      </Text>
                    </View>
                    <View className="bg-blue-100 px-2 py-1 rounded">
                      <Text className="text-blue-700 text-xs font-medium">
                        {exam.settings.timed
                          ? `${exam.settings.duration}m`
                          : "Untimed"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500 text-xs">
                      By {exam.teacher?.profile?.name || "Teacher"}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-blue-600 text-sm font-medium mr-1">
                        Start
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#3b82f6"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-center border border-gray-200 shadow-sm active:bg-gray-50"
              onPress={() => router.push("/(tabs)/exams")}
            >
              <Ionicons name="document-text" size={20} color="#3b82f6" />
              <Text className="text-gray-900 font-semibold ml-2">Take Exam</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-center border border-gray-200 shadow-sm active:bg-gray-50"
              onPress={() => router.push("/(tabs)/results")}
            >
              <Ionicons name="bar-chart" size={20} color="#10b981" />
              <Text className="text-gray-900 font-semibold ml-2">Results</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center justify-center border border-gray-200 shadow-sm active:bg-gray-50"
              onPress={() => router.push("/(tabs)/homework")}
            >
              <Ionicons name="book" size={20} color="#f59e0b" />
              <Text className="text-gray-900 font-semibold ml-2">Homework</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}