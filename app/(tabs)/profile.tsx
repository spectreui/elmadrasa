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
import { ProfileStats, Achievement, ProfileSettings } from '../../src/types';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'settings'>('profile');
  const [loading, setLoading] = useState(false);

  // Mock profile stats
  const [profileStats] = useState<ProfileStats>({
    examsTaken: 24,
    averageScore: 85,
    totalPoints: 1240,
    rank: 5,
    streak: 7,
    attendance: 96,
  });

  // Mock achievements
  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Perfect Score',
      description: 'Score 100% on any exam',
      icon: 'trophy',
      unlocked: true,
      unlockedAt: '2024-01-10',
    },
    {
      id: '2',
      title: 'Exam Master',
      description: 'Complete 20 exams',
      icon: 'school',
      unlocked: true,
      unlockedAt: '2024-01-15',
    },
    {
      id: '3',
      title: 'Perfect Attendance',
      description: '100% attendance for a month',
      icon: 'calendar',
      unlocked: false,
      progress: 85,
    },
    {
      id: '4',
      title: 'Speed Runner',
      description: 'Complete an exam in half the time',
      icon: 'speedometer',
      unlocked: false,
      progress: 40,
    },
    {
      id: '5',
      title: 'Subject Expert',
      description: 'Master 5 different subjects',
      icon: 'library',
      unlocked: true,
      unlockedAt: '2024-01-20',
    },
  ]);

  // Settings state
  const [settings, setSettings] = useState<ProfileSettings>({
    notifications: true,
    darkMode: false,
    language: 'English',
    autoSave: true,
    dataSaver: false,
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

  const toggleSetting = (key: keyof ProfileSettings) => {
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
            <Text className="text-gray-600 text-base mb-2">
              {user?.profile.class} • {user?.student_id}
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

      {/* Quick Stats */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Performance Overview
        </Text>
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
              #{profileStats.rank}
            </Text>
            <Text className="text-gray-500 text-xs text-center mt-1">
              Class Rank
            </Text>
          </View>
          <View className="items-center p-4 bg-gray-50 rounded-xl">
            <Text className="text-2xl font-bold text-gray-900">
              {profileStats.streak}
            </Text>
            <Text className="text-gray-500 text-xs text-center mt-1">
              Day Streak
            </Text>
          </View>
        </View>
      </View>

      {/* Detailed Stats */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Detailed Statistics
        </Text>
        <View className="space-y-4">
          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700 font-medium">Total Points</Text>
              <Text className="text-gray-900 font-semibold">{profileStats.totalPoints}</Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-2">
              <View 
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${Math.min(100, (profileStats.totalPoints / 2000) * 100)}%` }}
              />
            </View>
          </View>
          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700 font-medium">Attendance</Text>
              <Text className="text-gray-900 font-semibold">{profileStats.attendance}%</Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-2">
              <View 
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${profileStats.attendance}%` }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Subjects */}
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-4">
          Subjects
        </Text>
        <View className="space-y-3">
          {user?.profile.subjects?.map((subject, index) => (
            <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <Text className="text-gray-700 font-medium">{subject}</Text>
              <View className="flex-row items-center">
                <Text className="text-gray-900 font-semibold mr-2">88%</Text>
                <Ionicons name="trending-up" size={16} color="#10b981" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAchievementsTab = () => (
    <View className="space-y-6">
      <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <Text className="text-xl font-semibold text-gray-900 mb-2">
          Achievements
        </Text>
        <Text className="text-gray-600 text-sm mb-4">
          {achievements.filter(a => a.unlocked).length} of {achievements.length} unlocked
        </Text>
        
        <View className="space-y-4">
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              className={`flex-row items-center p-4 rounded-xl border ${
                achievement.unlocked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <View
                className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                  achievement.unlocked
                    ? 'bg-green-100'
                    : 'bg-gray-200'
                }`}
              >
                <Ionicons
                  name={achievement.icon as any}
                  size={24}
                  color={achievement.unlocked ? '#10b981' : '#9ca3af'}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`font-semibold text-base ${
                    achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {achievement.title}
                </Text>
                <Text
                  className={`text-sm ${
                    achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {achievement.description}
                </Text>
                {achievement.unlocked && achievement.unlockedAt && (
                  <Text className="text-green-600 text-xs mt-1">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </Text>
                )}
                {!achievement.unlocked && achievement.progress && (
                  <View className="mt-2">
                    <View className="w-full bg-gray-200 rounded-full h-1">
                      <View
                        className="h-1 rounded-full bg-blue-500"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </View>
                    <Text className="text-gray-500 text-xs mt-1">
                      {achievement.progress}% complete
                    </Text>
                  </View>
                )}
              </View>
              {achievement.unlocked && (
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              )}
            </View>
          ))}
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
            { key: 'achievements' as const, label: 'Achievements', icon: 'trophy' },
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
        {activeTab === 'achievements' && renderAchievementsTab()}
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