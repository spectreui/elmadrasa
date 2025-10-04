// app/(teacher)/exams.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Exam } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

export default function TeacherExamsScreen() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "draft" | "archived">(
    "active"
  );

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExams();

      if (response.data.success) {
        setExams(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExam = async (examId: string) => {
    Alert.alert(
      "Delete Exam",
      "Are you sure you want to delete this exam? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // TODO: Implement delete exam API
              setExams((prev) => prev.filter((exam) => exam.id !== examId));
              Alert.alert("Success", "Exam deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete exam");
            }
          },
        },
      ]
    );
  };

  const duplicateExam = (exam: Exam) => {
    // TODO: Implement duplicate exam logic
    Alert.alert("Info", "Duplicate exam functionality coming soon");
  };

  const getSubmissionsCount = (examId: string) => {
    // Mock data - in real app, you'd fetch this from API
    return Math.floor(Math.random() * 30) + 5;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="text-slate-600 mt-4 text-base">
          Loading your exams...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      showsVerticalScrollIndicator={false}
    >
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-3xl font-bold text-slate-900">My Exams</Text>
            <Text className="text-slate-600 mt-1">
              Manage and track your created exams
            </Text>
          </View>
          <TouchableOpacity
            className="bg-slate-900 px-4 py-2 rounded-lg flex-row items-center"
            onPress={() => router.push("/(teacher)/create-exam")}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white font-medium ml-2">New Exam</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-slate-100 rounded-lg p-1 mb-6">
          {[
            { key: "active", label: "Active", icon: "play" },
            { key: "draft", label: "Drafts", icon: "document" },
            { key: "archived", label: "Archived", icon: "archive" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-2 rounded-md flex-row justify-center items-center ${
                activeTab === tab.key ? "bg-white shadow-sm" : ""
              }`}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? "#0f172a" : "#64748b"}
              />
              <Text
                className={`ml-2 text-sm font-medium ${
                  activeTab === tab.key ? "text-slate-900" : "text-slate-600"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Exams List */}
        <View className="space-y-4">
          {exams.map((exam) => (
            <View
              key={exam.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-slate-900 mb-1">
                    {exam.title}
                  </Text>
                  <Text className="text-slate-600 text-sm">
                    {exam.subject} • {exam.class} •{" "}
                    {exam.settings.timed
                      ? `${exam.settings.duration}m`
                      : "Untimed"}
                  </Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-800 text-xs font-medium">
                    Active
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center space-x-4">
                  <View className="flex-row items-center">
                    <Ionicons name="people" size={16} color="#64748b" />
                    <Text className="text-slate-600 text-sm ml-1">
                      {getSubmissionsCount(exam.id)} submissions
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="calendar" size={16} color="#64748b" />
                    <Text className="text-slate-600 text-sm ml-1">
                      {exam.created_at
                        ? new Date(exam.created_at).toLocaleDateString()
                        : "Unknown"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    className="bg-blue-100 px-3 py-2 rounded-lg flex-row items-center"
                    onPress={() => router.push(`/exam/${exam.id}?edit=true`)}
                  >
                    <Ionicons name="eye" size={16} color="#3b82f6" />
                    <Text className="text-blue-700 font-medium ml-1 text-sm">
                      View
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-green-100 px-3 py-2 rounded-lg flex-row items-center"
                    onPress={() =>
                      router.push(`/(teacher)/exam-results/${exam.id}`)
                    }
                  >
                    <Ionicons name="bar-chart" size={16} color="#10b981" />
                    <Text className="text-green-700 font-medium ml-1 text-sm">
                      Results
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => duplicateExam(exam)}
                  >
                    <Ionicons name="copy" size={16} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => deleteExam(exam.id)}
                  >
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Stats */}
        <View className="grid grid-cols-3 gap-4 mt-6">
          <View className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">
              Total Exams
            </Text>
            <Text className="text-2xl font-bold text-slate-900">
              {exams.length}
            </Text>
          </View>
          <View className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">
              Total Submissions
            </Text>
            <Text className="text-2xl font-bold text-slate-900">
              {exams.reduce(
                (sum, exam) => sum + getSubmissionsCount(exam.id),
                0
              )}
            </Text>
          </View>
          <View className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">
              Avg. Score
            </Text>
            <Text className="text-2xl font-bold text-slate-900">78%</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
