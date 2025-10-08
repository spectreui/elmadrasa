import React, { useState, useEffect } from 'react';
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
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

interface ProfileStats {
  examsTaken: number;
  averageScore: number;
  totalPoints: number;
  rank: number;
  streak: number;
  attendance: number;
  upcomingExams?: number;
  pendingHomework?: number;
}

interface SubjectPerformance {
  subject: string;
  averageScore: number;
  examsTaken: number;
  trend: 'up' | 'down' | 'stable';
}

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  status: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    examsTaken: 0,
    averageScore: 0,
    totalPoints: 0,
    rank: 0,
    streak: 0,
    attendance: 0,
    upcomingExams: 0,
    pendingHomework: 0,
  });
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSave: true,
    dataSaver: false,
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setProfileLoading(true);
      
      // Load all profile data in parallel
      const [statsResponse, performanceResponse, dashboardResponse] = await Promise.all([
        apiService.getStudentStats(),
        apiService.getSubjectPerformance(),
        apiService.getStudentDashboardStats()
      ]);

      if (statsResponse.data.success) {
        const stats = statsResponse.data.data;
        setProfileStats(prev => ({
          ...prev,
          examsTaken: stats?.examsCompleted || 0,
          averageScore: stats?.averageScore || 0,
          totalPoints: stats?.totalPoints || 0,
          upcomingExams: stats?.upcomingExams || 0,
        }));
      }

      if (dashboardResponse.data.success) {
        const dashboardData = dashboardResponse.data.data;
        setProfileStats(prev => ({
          ...prev,
          pendingHomework: dashboardData?.pendingHomework || 0,
          examsTaken: dashboardData?.examsCompleted || prev.examsTaken,
          averageScore: dashboardData?.averageScore || prev.averageScore,
          totalPoints: dashboardData?.totalPoints || prev.totalPoints,
          upcomingExams: dashboardData?.upcomingExams || prev.upcomingExams,
        }));
        setRecentActivity(dashboardData?.recentActivity || []);
      }

      if (performanceResponse.data.success) {
        setSubjectPerformance(performanceResponse.data.data || []);
      }

    } catch (error: any) {
      console.error('Failed to load profile data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

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

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderProfileTab = () => (
    <View className="space-y-6">
      {/* Profile Header */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <View className="flex-row items-center">
          <View className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center mr-4">
            <Text className="text-white text-2xl font-bold">
              {getInitials(user?.profile?.name || 'Student')}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {user?.profile?.name || 'Student'}
            </Text>
            <Text className="text-gray-600 text-base mb-2">
              {user?.profile?.class ? `Class ${user.profile.class}` : 'Class Not Set'} • {user?.student_id || 'ID'}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="mail" size={16} color="#6b7280" />
              <Text className="text-gray-500 text-sm ml-1">
                {user?.email || 'email@example.com'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Performance Overview
        </Text>
        {profileLoading ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : (
          <View className="grid grid-cols-2 gap-4">
            <View className="items-center p-4 bg-gray-50 rounded-xl">
              <Text className="text-2xl font-bold text-gray-900">
                {profileStats.examsTaken}
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-1">
                Exams Taken
              </Text>
            </View>
            <View className="items-center p-4 bg-gray-50 rounded-xl">
              <Text className={`text-2xl font-bold ${getGradeColor(profileStats.averageScore)}`}>
                {profileStats.averageScore}%
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-1">
                Average Score
              </Text>
            </View>
            <View className="items-center p-4 bg-gray-50 rounded-xl">
              <Text className="text-2xl font-bold text-gray-900">
                {profileStats.upcomingExams || 0}
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-1">
                Upcoming Exams
              </Text>
            </View>
            <View className="items-center p-4 bg-gray-50 rounded-xl">
              <Text className="text-2xl font-bold text-gray-900">
                {profileStats.pendingHomework || 0}
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-1">
                Pending Homework
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Subject Performance */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Subject Performance
        </Text>
        {profileLoading ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : subjectPerformance.length > 0 ? (
          <View className="space-y-4">
            {subjectPerformance.map((subject, index) => (
              <View key={index} className="space-y-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-700 font-medium capitalize">
                    {subject.subject}
                  </Text>
                  <Text className={`font-semibold ${getGradeColor(subject.averageScore)}`}>
                    {subject.averageScore}%
                  </Text>
                </View>
                <View className="w-full bg-gray-200 rounded-full h-2">
                  <View 
                    className={`h-2 rounded-full ${getGradeBgColor(subject.averageScore)}`}
                    style={{ width: `${Math.min(100, subject.averageScore)}%` }}
                  />
                </View>
                <View className="flex-row justify-between text-xs text-gray-500">
                  <Text>{subject.examsTaken} exams</Text>
                  <Text className={`${
                    subject.trend === 'up' ? 'text-green-600' : 
                    subject.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {subject.trend === 'up' ? '↗ Improving' : 
                     subject.trend === 'down' ? '↘ Needs work' : '→ Stable'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-gray-500 text-center py-4">
            No subject performance data available
          </Text>
        )}
      </View>

      {/* Recent Activity */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Recent Activity
        </Text>
        {recentActivity.length > 0 ? (
          <View className="space-y-3">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <View key={index} className="flex-row items-center py-2 border-b border-gray-100 last:border-b-0">
                <View className={`w-2 h-2 rounded-full mr-3 ${
                  activity.type === 'exam' ? 'bg-blue-500' : 
                  activity.type === 'homework' ? 'bg-green-500' : 'bg-gray-500'
                }`} />
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium">{activity.title}</Text>
                  <Text className="text-gray-500 text-sm">{activity.description}</Text>
                </View>
                <Text className="text-gray-400 text-xs">
                  {new Date(activity.date).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-gray-500 text-center py-4">
            No recent activity
          </Text>
        )}
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
              <Text className="text-gray-500 text-sm">Exam reminders and updates</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting('notifications')}
              trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
              thumbColor={settings.notifications ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Dark Mode */}
        <View className="p-4 border-b border-gray-100">
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

        {/* Auto Save */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-gray-900 font-medium text-base">Auto Save</Text>
              <Text className="text-gray-500 text-sm">Save progress automatically</Text>
            </View>
            <Switch
              value={settings.autoSave}
              onValueChange={() => toggleSetting('autoSave')}
              trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
              thumbColor={settings.autoSave ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Data Saver */}
        <View className="p-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-gray-900 font-medium text-base">Data Saver</Text>
              <Text className="text-gray-500 text-sm">Reduce data usage</Text>
            </View>
            <Switch
              value={settings.dataSaver}
              onValueChange={() => toggleSetting('dataSaver')}
              trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
              thumbColor={settings.dataSaver ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>
      </View>

      {/* App Information */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          App Information
        </Text>
        <View className="space-y-3">
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-gray-700">Version</Text>
            <Text className="text-gray-900 font-medium">1.0.0</Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-gray-700">Build Number</Text>
            <Text className="text-gray-900 font-medium">2024.1</Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-gray-700">Last Updated</Text>
            <Text className="text-gray-900 font-medium">Jan 15, 2024</Text>
          </View>
        </View>
      </View>

      {/* Support */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Support
        </Text>
        <View className="space-y-3">
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-blue-600 font-medium">Help Center</Text>
            <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-blue-600 font-medium">Contact Support</Text>
            <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-3">
            <Text className="text-blue-600 font-medium">Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
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
              className={`flex-1 py-4 flex-row justify-center items-center border-b-2 ${
                activeTab === tab.key
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
                className={`ml-2 font-medium ${
                  activeTab === tab.key
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