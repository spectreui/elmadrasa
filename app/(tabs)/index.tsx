// app/(tabs)/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Exam } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

interface DashboardStats {
  averageScore: number;
  examsCompleted: number;
  upcomingExams: number;
  totalPoints: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    averageScore: 0,
    examsCompleted: 0,
    upcomingExams: 0,
    totalPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // app/(tabs)/index.tsx - Updated loadDashboardData function
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      console.log("🔄 Loading dashboard data...");

      // Load student stats from real API
      const statsResponse = await apiService.getStudentStats();
      console.log("📊 Stats API response:", statsResponse.data);

      if (statsResponse.data.success) {
        const statsData = statsResponse.data.data;
        setStats({
          averageScore: statsData.averageScore || 0,
          examsCompleted: statsData.examsCompleted || 0,
          upcomingExams: statsData.upcomingExams || 0,
          totalPoints: statsData.totalPoints || 0,
        });
      }

      // Load upcoming exams
      const examsResponse = await apiService.getExams();
      if (examsResponse.data.success) {
        const exams = examsResponse.data.data || [];
        // Filter to show only exams not yet taken (you might want to add a "taken" flag)
        setUpcomingExams(exams.slice(0, 3));
      }
    } catch (error) {
      console.error("❌ Failed to load dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
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


  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="text-slate-600 mt-4 text-base">
          Loading your dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-slate-900">
            Welcome back
          </Text>
          <Text className="text-slate-600 mt-2 text-base">
            {user?.profile.name} • {user?.profile.class} • {user?.student_id}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="grid grid-cols-2 gap-4 mb-8">
          <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-sm font-medium">
                Average
              </Text>
              <Ionicons name="trending-up" size={16} color="#64748b" />
            </View>
            <Text
              className={`text-2xl font-bold ${getGradeColor(
                stats.averageScore
              )}`}
            >
              {stats.averageScore}%
            </Text>
            <Text className="text-slate-400 text-xs mt-1">
              Overall performance
            </Text>
          </View>

          <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-sm font-medium">
                Completed
              </Text>
              <Ionicons name="checkmark-circle" size={16} color="#64748b" />
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              {stats.examsCompleted}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">Exams taken</Text>
          </View>

          <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-sm font-medium">
                Upcoming
              </Text>
              <Ionicons name="calendar" size={16} color="#64748b" />
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              {stats.upcomingExams}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">Scheduled exams</Text>
          </View>

          <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-sm font-medium">Points</Text>
              <Ionicons name="star" size={16} color="#64748b" />
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              {stats.totalPoints}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">Total earned</Text>
          </View>
        </View>

        {/* Upcoming Exams Section */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-slate-900">
              Upcoming Exams
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/exams")}
              className="flex-row items-center"
            >
              <Text className="text-slate-600 text-sm font-medium mr-1">
                View all
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          {upcomingExams.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center border border-slate-200">
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#cbd5e1"
              />
              <Text className="text-slate-500 text-lg mt-4 font-medium">
                No upcoming exams
              </Text>
              <Text className="text-slate-400 text-sm mt-2 text-center">
                You&apos;re all caught up for now
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {upcomingExams.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm active:bg-slate-50"
                  onPress={() => router.push(`/exam/${exam.id}`)}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-slate-900 mb-1">
                        {exam.title}
                      </Text>
                      <Text className="text-slate-600 text-sm">
                        {exam.subject} • {exam.class}
                      </Text>
                    </View>
                    <View className="bg-slate-100 px-2 py-1 rounded">
                      <Text className="text-slate-700 text-xs font-medium">
                        {exam.settings.timed
                          ? `${exam.settings.duration}m`
                          : "Untimed"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-slate-500 text-xs">
                      By {exam.teacher?.profile?.name || "Teacher"}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-blue-600 text-sm font-medium mr-1">
                        Start
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#2563eb"
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
          <Text className="text-xl font-semibold text-slate-900 mb-4">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-slate-900 rounded-xl p-4 flex-row items-center justify-center shadow-sm"
              onPress={() => router.push("/(tabs)/exams")}
            >
              <Ionicons name="document-text" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Take Exam</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white rounded-xl p-4 flex-row items-center justify-center border border-slate-200 shadow-sm"
              onPress={() => router.push("/(tabs)/results")}
            >
              <Ionicons name="bar-chart" size={20} color="#0f172a" />
              <Text className="text-slate-900 font-semibold ml-2">Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
