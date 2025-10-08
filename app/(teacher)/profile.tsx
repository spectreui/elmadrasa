import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface TeacherStats {
  totalStudents: number;
  activeExams: number;
  averageClassScore: number;
  examsCreated: number;
  pendingGrading: number;
}

export default function TeacherProfileScreen() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [loading, setLoading] = useState(false);

  const [teacherStats] = useState<TeacherStats>({
    totalStudents: 156,
    activeExams: 8,
    averageClassScore: 78,
    examsCreated: 24,
    pendingGrading: 12,
  });

  const [settings, setSettings] = useState({
    notifications: true,
    examNotifications: true,
    gradingReminders: true,
    darkMode: false,
    autoSave: true,
  });

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              router.push('/(tabs)');
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleSetting = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof settings],
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const renderProfileTab = () => (
    <View className="space-y-6">
      {/* Profile Header */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <View className="flex-row items-center">
          <View className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center mr-4">
            <Text className="text-white text-2xl font-bold">
              {getInitials(user?.profile.name || '')}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {user?.profile.name}
            </Text>
            <Text className="text-gray-600 text-base mb-2 capitalize">
              {user?.role} • {user?.profile.class || 'All Classes'}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="mail" size={16} color="#6b7280" />
              <Text className="text-gray-500 text-sm ml-1">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Teacher Stats */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Teaching Overview
        </Text>
        <View className="grid grid-cols-2 gap-4">
          <View className="items-center p-4 bg-blue-50 rounded-xl">
            <Text className="text-2xl font-bold text-blue-600">
              {teacherStats.totalStudents}
            </Text>
            <Text className="text-blue-600 text-xs text-center mt-1">
              Students
            </Text>
          </View>
          <View className="items-center p-4 bg-green-50 rounded-xl">
            <Text className="text-2xl font-bold text-green-600">
              {teacherStats.examsCreated}
            </Text>
            <Text className="text-green-600 text-xs text-center mt-1">
              Exams Created
            </Text>
          </View>
          <View className="items-center p-4 bg-yellow-50 rounded-xl">
            <Text className="text-2xl font-bold text-yellow-600">
              {teacherStats.activeExams}
            </Text>
            <Text className="text-yellow-600 text-xs text-center mt-1">
              Active Exams
            </Text>
          </View>
          <View className="items-center p-4 bg-purple-50 rounded-xl">
            <Text className="text-2xl font-bold text-purple-600">
              {teacherStats.pendingGrading}
            </Text>
            <Text className="text-purple-600 text-xs text-center mt-1">
              To Grade
            </Text>
          </View>
        </View>
      </View>

      {/* Class Performance */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Class Performance
        </Text>
        <View className="space-y-4">
          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700 font-medium">Average Class Score</Text>
              <Text className="text-gray-900 font-semibold">{teacherStats.averageClassScore}%</Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-2">
              <View
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${teacherStats.averageClassScore}%` }}
              />
            </View>
          </View>
          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700 font-medium">Student Engagement</Text>
              <Text className="text-gray-900 font-semibold">92%</Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-2">
              <View
                className="h-2 rounded-full bg-blue-500"
                style={{ width: '92%' }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </Text>
        <View className="grid grid-cols-2 gap-3">
          <TouchableOpacity
            className="bg-blue-50 rounded-xl p-4 flex-row items-center justify-center border border-blue-200"
            onPress={() => router.push('/(teacher)/create-exam')}
          >
            <Ionicons name="add-circle" size={20} color="#3b82f6" />
            <Text className="text-blue-700 font-medium ml-2 text-sm">New Exam</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-green-50 rounded-xl p-4 flex-row items-center justify-center border border-green-200"
            onPress={() => router.push('/(teacher)/create-homework')}
          >
            <Ionicons name="book" size={20} color="#10b981" />
            <Text className="text-green-700 font-medium ml-2 text-sm">Homework</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View className="space-y-6">
      <View className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Notifications */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-gray-900 font-medium text-base">Notifications</Text>
              <Text className="text-gray-500 text-sm">General app notifications</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting('notifications')}
              trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
              thumbColor={settings.notifications ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Exam Notifications */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-gray-900 font-medium text-base">Exam Alerts</Text>
              <Text className="text-gray-500 text-sm">Exam completion alerts</Text>
            </View>
            <Switch
              value={settings.examNotifications}
              onValueChange={() => toggleSetting('examNotifications')}
              trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
              thumbColor={settings.examNotifications ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Grading Reminders */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-gray-900 font-medium text-base">Grading Reminders</Text>
              <Text className="text-gray-500 text-sm">Pending grading alerts</Text>
            </View>
            <Switch
              value={settings.gradingReminders}
              onValueChange={() => toggleSetting('gradingReminders')}
              trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
              thumbColor={settings.gradingReminders ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Dark Mode */}
        <View className="p-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-gray-900 font-medium text-base">Dark Mode</Text>
              <Text className="text-gray-500 text-sm">Use dark theme</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={() => toggleSetting('darkMode')}
              trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
              thumbColor={settings.darkMode ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>
      </View>

      {/* App Information */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Teacher Tools
        </Text>
        <View className="space-y-3">
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-blue-600 font-medium">Export Student Data</Text>
            <Ionicons name="download" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-blue-600 font-medium">Class Analytics</Text>
            <Ionicons name="bar-chart" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-3">
            <Text className="text-blue-600 font-medium">Teaching Resources</Text>
            <Ionicons name="library" size={16} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white border-b border-gray-200 px-6">
        <View className="flex-row">
          {[
            { key: 'profile' as const, label: 'Profile', icon: 'person' },
            { key: 'settings' as const, label: 'Settings', icon: 'settings' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-4 flex-row justify-center items-center border-b-2 ${activeTab === tab.key
                  ? 'border-blue-500'
                  : 'border-transparent'
                }`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? '#3b82f6' : '#6b7280'}
              />
              <Text
                className={`ml-2 font-medium ${activeTab === tab.key
                    ? 'text-blue-600'
                    : 'text-gray-600'
                  }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 p-6"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'settings' && renderSettingsTab()}

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-white rounded-2xl p-4 border border-red-200 shadow-sm mt-6 mb-8"
          onPress={handleLogout}
          disabled={loading}
        >
          <View className="flex-row justify-center items-center">
            {loading ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text className="text-red-600 font-semibold text-lg ml-2">
                  Sign Out
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}