// app/(teacher)/exams.tsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Exam } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

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
  const { user } = useAuth();
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [allExams, setAllExams] = useState<TeacherExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "draft" | "archived">("active");

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    filterExamsByTab();
  }, [activeTab, allExams]);

  const loadExams = async () => {
    try {
      setLoading(true);
      console.log("📚 Loading teacher exams...");
      
      // ✅ FIX: Use teacher endpoint instead of student endpoint
      const response = await apiService.getTeacherExams();
      
      console.log("✅ Teacher exams response:", response.data);

      if (response.data.success) {
        const examsData: TeacherExam[] = response.data.data || [];
        console.log(`📊 Loaded ${examsData.length} exams:`, examsData);
        
        setAllExams(examsData);
        filterExamsByTab(examsData);
      } else {
        console.log("❌ No exams data in response");
        setAllExams([]);
        setExams([]);
      }
    } catch (error: any) {
      console.error("❌ Failed to load exams:", error);
      Alert.alert("Error", "Failed to load exams. Please check your connection.");
      setAllExams([]);
      setExams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterExamsByTab = (examsData = allExams) => {
    console.log(`🔍 Filtering ${examsData.length} exams for tab:`, activeTab);
    
    const filtered = examsData.filter((exam) => {
      // ✅ FIX: Use proper status checking based on your actual data
      switch (activeTab) {
        case "active":
          // Active exams: is_active true OR status active OR no status field (default active)
          return exam.is_active !== false && exam.status !== "archived" && exam.status !== "draft";
        case "draft":
          // Draft exams: is_active false OR status draft
          return exam.is_active === false || exam.status === "draft";
        case "archived":
          // Archived exams: status archived
          return exam.status === "archived";
        default:
          return true;
      }
    });
    
    console.log(`✅ Filtered to ${filtered.length} exams`);
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
              // You'll need to implement deleteExam in your apiService
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
    // ✅ FIX: Better status detection based on actual data
    if (exam.status === "draft" || exam.is_active === false) {
      return { text: "Draft", color: "bg-gray-100 dark:bg-gray-700", textColor: "text-gray-600 dark:text-gray-400" };
    }
    
    if (exam.status === "archived") {
      return { text: "Archived", color: "bg-gray-100 dark:bg-gray-700", textColor: "text-gray-600 dark:text-gray-400" };
    }
    
    // Default to active
    return { text: "Active", color: "bg-green-50 dark:bg-green-900/20", textColor: "text-green-600 dark:text-green-400" };
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

    console.log(`📊 Tab counts - Active: ${activeCount}, Draft: ${draftCount}, Archived: ${archivedCount}`);
    
    return { active: activeCount, draft: draftCount, archived: archivedCount };
  };

  const tabCounts = getTabCounts();

  // Debug: Log what we're seeing
  console.log(`🎯 Current state: ${allExams.length} total exams, ${exams.length} filtered, activeTab: ${activeTab}`);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-gray-600 dark:text-gray-400 mt-4 text-base font-medium">Loading exams...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="bg-white dark:bg-gray-800 px-6 pt-16 pb-6 border-b border-gray-100 dark:border-gray-700">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">My Exams</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-base font-medium">
              {allExams.length} total exams • Manage your assessments
            </Text>
          </View>
          <TouchableOpacity
            className="bg-blue-500 px-5 py-3 rounded-xl flex-row items-center shadow-sm active:opacity-80"
            onPress={() => router.push("/(teacher)/create-exam")}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">New</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Info - Remove in production */}
        <View className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mb-4">
          <Text className="text-yellow-800 dark:text-yellow-200 text-sm">
            📊 Debug: {allExams.length} exams loaded • Showing {exams.length} in {activeTab} tab
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {[
            { key: "active" as const, label: "Active", icon: "play", count: tabCounts.active },
            { key: "draft" as const, label: "Drafts", icon: "document", count: tabCounts.draft },
            { key: "archived" as const, label: "Archived", icon: "archive", count: tabCounts.archived },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${
                activeTab === tab.key ? "bg-white dark:bg-gray-600 shadow-sm" : ""
              }`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? "#007AFF" : "#8E8E93"}
              />
              <Text
                className={`ml-2 text-sm font-semibold ${
                  activeTab === tab.key ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View className={`ml-2 px-2 py-1 rounded-full ${
                  activeTab === tab.key ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-200 dark:bg-gray-600"
                }`}>
                  <Text className={`text-xs font-semibold ${
                    activeTab === tab.key ? "text-blue-600 dark:text-blue-300" : "text-gray-600 dark:text-gray-300"
                  }`}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Exams List */}
      <View className="p-6">
        {exams.length === 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-12 items-center border border-gray-100 dark:border-gray-700">
            <Ionicons 
              name={
                activeTab === "active" ? "document-text-outline" :
                activeTab === "draft" ? "create-outline" : "archive-outline"
              } 
              size={64} 
              color="#D1D5DB" 
              className="dark:text-gray-600"
            />
            <Text className="text-gray-500 dark:text-gray-400 text-lg font-medium mt-4">
              {activeTab === "active" && "No active exams"}
              {activeTab === "draft" && "No draft exams"} 
              {activeTab === "archived" && "No archived exams"}
            </Text>
            <Text className="text-gray-400 dark:text-gray-500 text-sm text-center mt-2">
              {activeTab === "active" && allExams.length > 0 
                ? "All exams are in draft or archived status" 
                : "Create your first exam to get started"}
            </Text>
            {activeTab === "active" && allExams.length === 0 && (
              <TouchableOpacity
                className="bg-blue-500 px-6 py-3 rounded-xl flex-row items-center mt-6"
                onPress={() => router.push("/(teacher)/create-exam")}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">Create Exam</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="space-y-4">
            {exams.map((exam) => {
              const statusBadge = getStatusBadge(exam);
              
              return (
                <View
                  key={exam.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {exam.title}
                      </Text>
                      <View className="flex-row items-center space-x-3">
                        <View className="flex-row items-center">
                          <Ionicons name="book" size={14} color="#8E8E93" className="dark:text-gray-400" />
                          <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium ml-1">
                            {exam.subject}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="people" size={14} color="#8E8E93" className="dark:text-gray-400" />
                          <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium ml-1">
                            {exam.class}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="time" size={14} color="#8E8E93" className="dark:text-gray-400" />
                          <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium ml-1">
                            {exam.settings?.timed ? `${exam.settings.duration}m` : "Untimed"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${statusBadge.color}`}>
                      <Text className={`text-sm font-semibold ${statusBadge.textColor}`}>
                        {statusBadge.text}
                      </Text>
                    </View>
                  </View>

                  {/* Stats Row */}
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center space-x-4">
                      <View className="flex-row items-center">
                        <Ionicons name="person" size={16} color="#007AFF" />
                        <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium ml-1">
                          {exam.submissions_count || 0} submissions
                        </Text>
                      </View>
                      {exam.average_score !== undefined && exam.average_score > 0 && (
                        <View className="flex-row items-center">
                          <Ionicons name="trophy" size={16} color="#FF9500" />
                          <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium ml-1">
                            {exam.average_score}% avg
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-400 dark:text-gray-500 text-sm">
                      {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : "Unknown"}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg flex-row items-center"
                        onPress={() => router.push(`/(teacher)/exams/${exam.id}`)}
                      >
                        <Ionicons name="eye" size={16} color="#007AFF" />
                        <Text className="text-blue-600 dark:text-blue-400 font-semibold text-sm ml-1">
                          View
                        </Text>
                      </TouchableOpacity>
                      
                      {(exam.submissions_count || 0) > 0 && (
                        <TouchableOpacity
                          className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg flex-row items-center"
                          onPress={() => router.push(`/(teacher)/exam-results/${exam.id}`)}
                        >
                          <Ionicons name="bar-chart" size={16} color="#34C759" />
                          <Text className="text-green-600 dark:text-green-400 font-semibold text-sm ml-1">
                            Results
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg items-center justify-center"
                        onPress={() => Alert.alert("Info", "Duplicate feature coming soon")}
                      >
                        <Ionicons name="copy" size={18} color="#8E8E93" className="dark:text-gray-400" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg items-center justify-center"
                        onPress={() => deleteExam(exam.id, exam.title)}
                      >
                        <Ionicons name="trash" size={18} color="#FF3B30" />
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
          <View className="grid grid-cols-3 gap-4 mt-6">
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Showing</Text>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">{exams.length}</Text>
            </View>
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Submissions</Text>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                {exams.reduce((sum, exam) => sum + (exam.submissions_count || 0), 0)}
              </Text>
            </View>
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
              <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Active</Text>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                {tabCounts.active}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}