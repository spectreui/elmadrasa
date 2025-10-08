// app/(teacher)/classes.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { ClassStats } from '../../src/types';

export default function ClassesScreen() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await apiService.getTeacherClassesWithStats();
      if (response.data.success) {
        setClasses(response.data.data || []);
      } else {
        setClasses([]); // Empty array instead of mock data
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]); // Empty array instead of mock data
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="text-slate-600 mt-4 text-base">Loading classes...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        <Text className="text-3xl font-bold text-slate-900 mb-6">My Classes</Text>

        <View className="space-y-4">
          {classes.map((classInfo) => (
            <TouchableOpacity
              key={classInfo.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm active:bg-slate-50"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-xl font-semibold text-slate-900 mb-1">
                    {classInfo.subject}
                  </Text>
                  <Text className="text-slate-600 text-sm">
                    {classInfo.subject} • {classInfo.studentCount} students
                  </Text>
                </View>
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-blue-800 text-sm font-medium">
                    {classInfo.averageScore}% avg
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <Ionicons name="document-text" size={16} color="#64748b" />
                  <Text className="text-slate-600 text-sm ml-2">
                    {classInfo.upcomingExams} upcoming exams
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-blue-600 font-medium mr-2">View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add New Class */}
        <TouchableOpacity className="bg-white rounded-xl p-5 border border-slate-200 border-dashed shadow-sm mt-6">
          <View className="flex-row items-center justify-center">
            <Ionicons name="add-circle" size={24} color="#64748b" />
            <Text className="text-slate-600 font-medium ml-3">Add New Class</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}