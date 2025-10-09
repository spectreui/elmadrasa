// app/(tabs)/results.tsx - Replace the entire file with this simpler version
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
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Ionicons } from "@expo/vector-icons";

interface ExamResult {
  id: string;
  examTitle: string;
  subject: string;
  score: number;
  totalPoints: number;
  percentage: number;
  date: string;
  timeSpent: string;
  correctAnswers: number;
  totalQuestions: number;
}

interface SubjectPerformance {
  subject: string;
  averageScore: number;
  examsTaken: number;
  trend: "up" | "down" | "stable";
}

export default function ResultsScreen() {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "recent" | "top">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);
 
  // In your app/(tabs)/results.tsx - update the loadResults function
const loadResults = async () => {
  try {
    setLoading(true);

    console.log("🔄 Loading student results...");
    console.log("🔐 Current API token:", apiService.getToken() ? 'Present' : 'Missing');

    // Load exam results from real API
    const resultsResponse = await apiService.getStudentResults();
    console.log("📊 Results API response:", {
      success: resultsResponse.data.success,
      dataLength: resultsResponse.data.data?.length || 0,
      error: resultsResponse.data.error
    });

    if (resultsResponse.data.success) {
      setResults(
        Array.isArray(resultsResponse.data.data)
          ? resultsResponse.data.data
          : []
      );
    } else {
      console.error("Failed to load results:", resultsResponse.data.error);
      Alert.alert("Error", "Failed to load results");
    }

    // Load subject performance from real API
    const performanceResponse = await apiService.getSubjectPerformance();
    console.log("📈 Performance API response:", {
      success: performanceResponse.data.success,
      dataLength: performanceResponse.data.data?.length || 0,
      error: performanceResponse.data.error
    });

    if (performanceResponse.data.success) {
      setSubjectPerformance(
        Array.isArray(performanceResponse.data.data)
          ? performanceResponse.data.data
          : []
      ); 
    } else {
      console.error(
        "Failed to load performance:",
        performanceResponse.data.error
      );
    }
  } catch (error: any) {
    console.error("❌ Failed to load results:", error);
    console.error("❌ Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    Alert.alert("Error", "Failed to load results data");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const onRefresh = () => {
    setRefreshing(true);
    loadResults();
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeBgColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-50 border-green-200";
    if (percentage >= 80) return "bg-blue-50 border-blue-200";
    if (percentage >= 70) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const filteredResults = results.filter((result) => {
    if (selectedFilter === "recent") {
      return results.indexOf(result) < 5; // Last 5 results
    }
    if (selectedFilter === "top") {
      return result.percentage >= 80;
    }
    return true;
  });

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="text-slate-600 mt-4 text-base">
          Loading your results...
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
            Exam Results
          </Text>
          <Text className="text-slate-600 mt-2 text-base">
            Your performance overview and detailed results
          </Text>
        </View>

        {/* Performance Overview */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-slate-900 mb-4">
            Performance Overview
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="pb-4"
          >
            <View className="flex-row gap-4">
              {subjectPerformance.map((subject, index) => (
                <View
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 shadow-sm min-w-[140px]"
                >
                  <Text className="text-slate-900 font-semibold text-sm mb-2">
                    {subject.subject}
                  </Text>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-2xl font-bold text-slate-900">
                      {subject.averageScore}%
                    </Text>
                    <Ionicons
                      name={
                        subject.trend === "up"
                          ? "trending-up"
                          : subject.trend === "down"
                          ? "trending-down"
                          : "remove"
                      }
                      size={16}
                      color={
                        subject.trend === "up"
                          ? "#10b981"
                          : subject.trend === "down"
                          ? "#ef4444"
                          : "#64748b"
                      }
                    />
                  </View>
                  <Text className="text-slate-500 text-xs">
                    {subject.examsTaken} exams
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row bg-slate-100 rounded-lg p-1 mb-6">
          {[
            { key: "all", label: "All Results" },
            { key: "recent", label: "Recent" },
            { key: "top", label: "Top Scores" },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              className={`flex-1 py-2 rounded-md ${
                selectedFilter === filter.key ? "bg-white dark:bg-gray-800 shadow-sm" : ""
              }`}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  selectedFilter === filter.key
                    ? "text-slate-900"
                    : "text-slate-600"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Results List */}
        <View className="mb-6">
          <Text className="text-xl font-semibold text-slate-900 mb-4">
            {selectedFilter === "recent"
              ? "Recent Results"
              : selectedFilter === "top"
              ? "Top Performances"
              : "All Results"}
          </Text>

          {filteredResults.length === 0 ? (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-8 items-center border border-slate-200">
              <Ionicons name="stats-chart" size={48} color="#cbd5e1" />
              <Text className="text-slate-500 text-lg mt-4 font-medium">
                No results found
              </Text>
              <Text className="text-slate-400 text-sm mt-2 text-center">
                {selectedFilter === "top"
                  ? "No top scores yet"
                  : "Complete some exams to see your results here"}
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {filteredResults.map((result) => (
                <View
                  key={result.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 shadow-sm"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-slate-900 mb-1">
                        {result.examTitle}
                      </Text>
                      <Text className="text-slate-600 text-sm">
                        {result.subject} •{" "}
                        {new Date(result.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${getGradeBgColor(
                        result.percentage
                      )}`}
                    >
                      <Text
                        className={`text-sm font-bold ${getGradeColor(
                          result.percentage
                        )}`}
                      >
                        {getGradeLabel(result.percentage)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center mb-3">
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-slate-900">
                        {result.percentage}%
                      </Text>
                      <Text className="text-slate-500 text-xs">Score</Text>
                    </View>
                    <View className="h-8 w-px bg-slate-200" />
                    <View className="items-center">
                      <Text className="text-lg font-semibold text-slate-900">
                        {result.correctAnswers}/{result.totalQuestions}
                      </Text>
                      <Text className="text-slate-500 text-xs">Correct</Text>
                    </View>
                    <View className="h-8 w-px bg-slate-200" />
                    <View className="items-center">
                      <Text className="text-lg font-semibold text-slate-900">
                        {result.timeSpent}
                      </Text>
                      <Text className="text-slate-500 text-xs">Time</Text>
                    </View>
                  </View>

                  <View className="w-full bg-slate-100 rounded-full h-2">
                    <View
                      className={`h-2 rounded-full ${
                        result.percentage >= 90
                          ? "bg-green-500"
                          : result.percentage >= 80
                          ? "bg-blue-500"
                          : result.percentage >= 70
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${result.percentage}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Overall Stats */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 shadow-sm">
          <Text className="text-lg font-semibold text-slate-900 mb-4">
            Summary
          </Text>
          <View className="grid grid-cols-2 gap-4">
            <View>
              <Text className="text-slate-500 text-sm">Total Exams</Text>
              <Text className="text-slate-900 font-semibold text-lg">
                {results.length}
              </Text>
            </View>
            <View>
              <Text className="text-slate-500 text-sm">Average Score</Text>
              <Text className="text-slate-900 font-semibold text-lg">
                {results.length > 0
                  ? Math.round(
                      results.reduce((sum, r) => sum + r.percentage, 0) /
                        results.length
                    )
                  : 0}
                %
              </Text>
            </View>
            <View>
              <Text className="text-slate-500 text-sm">Best Subject</Text>
              <Text className="text-slate-900 font-semibold text-lg">
                {subjectPerformance.length > 0
                  ? subjectPerformance.reduce((best, current) =>
                      current.averageScore > best.averageScore ? current : best
                    ).subject
                  : "N/A"}
              </Text>
            </View>
            <View>
              <Text className="text-slate-500 text-sm">Total Time</Text>
              <Text className="text-slate-900 font-semibold text-lg">
                {results.reduce((total, result) => {
                  const time = parseInt(result.timeSpent);
                  return total + (isNaN(time) ? 0 : time);
                }, 0)}
                m
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}