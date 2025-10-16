// app/(admin)/settings.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import Alert from '@/components/Alert';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';
import { useThemeContext } from '@/contexts/ThemeContext';import { useTranslation } from "@/hooks/useTranslation";

interface Level {
  id: string;
  name: string;
  short_name: string;
  description?: string;
}

interface Class {
  id: string;
  name: string;
  level_id: string;
  grade: string;
  section: string;
  level?: Level;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  level_id: string;
  description?: string;
  level?: Level;
}

export default function SettingsPage() {const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'levels' | 'classes' | 'subjects'>('levels');
  const [levels, setLevels] = useState<Level[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { colors } = useThemeContext();


  // Form states
  const [levelForm, setLevelForm] = useState({ name: '', short_name: '', description: '' });
  const [classForm, setClassForm] = useState({ name: '', level_id: '', grade: '', section: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', level_id: '', description: '' });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      switch (activeTab) {
        case 'levels':
          const levelsRes = await apiService.getLevels();
          setLevels(levelsRes.data.data || []);
          break;
        case 'classes':
          const classesRes = await apiService.getClasses();
          setClasses(classesRes.data.data || []);
          break;
        case 'subjects':
          const subjectsRes = await apiService.getSubjects();
          setSubjects(subjectsRes.data.data || []);
          break;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLevel = async () => {
    if (!levelForm.name || !levelForm.short_name) {
      Alert.alert('Error', 'Name and short name are required');
      return;
    }

    try {
      await apiService.createLevel(levelForm);
      Alert.alert('Success', 'Level created successfully');
      setLevelForm({ name: '', short_name: '', description: '' });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to create level:', error);
      Alert.alert('Error', 'Failed to create level');
    }
  };

  const handleCreateClass = async () => {
    if (!classForm.name || !classForm.level_id || !classForm.grade || !classForm.section) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      await apiService.createClass(classForm);
      Alert.alert('Success', 'Class created successfully');
      setClassForm({ name: '', level_id: '', grade: '', section: '' });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to create class:', error);
      Alert.alert('Error', 'Failed to create class');
    }
  };

  const handleCreateSubject = async () => {
    if (!subjectForm.name || !subjectForm.code || !subjectForm.level_id) {
      Alert.alert('Error', 'Name, code, and level are required');
      return;
    }

    try {
      await apiService.createSubject(subjectForm);
      Alert.alert('Success', 'Subject created successfully');
      setSubjectForm({ name: '', code: '', level_id: '', description: '' });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to create subject:', error);
      Alert.alert('Error', 'Failed to create subject');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View className="items-center justify-center py-12">
          <Text className={cn('text-lg', colors.textPrimary)}>{t("common.loading")}</Text>
        </View>);

    }

    if (showCreateForm) {
      return renderCreateForm();
    }

    switch (activeTab) {
      case 'levels':
        return (
          <View className="space-y-3">
            {levels.map((level) =>
            <View key={level.id} className={cn('p-4 rounded-2xl border', colors.backgroundElevated, colors.border)}>
                <Text className={cn('text-lg font-semibold', colors.textPrimary)}>
                  {level.name} ({level.short_name})
                </Text>
                {level.description &&
              <Text className={cn('text-sm mt-1', colors.textSecondary)}>
                    {level.description}
                  </Text>
              }
              </View>
            )}
          </View>);


      case 'classes':
        return (
          <View className="space-y-3">
            {classes.map((classItem) =>
            <View key={classItem.id} className={cn('p-4 rounded-2xl border', colors.backgroundElevated, colors.border)}>
                <Text className={cn('text-lg font-semibold', colors.textPrimary)}>
                  {classItem.name}
                </Text>
                <Text className={cn('text-sm mt-1', colors.textSecondary)}>
                  Grade {classItem.grade} - Section {classItem.section}
                </Text>
                {classItem.level &&
              <Text className={cn('text-sm', colors.textSecondary)}>
                    Level: {classItem.level.name}
                  </Text>
              }
              </View>
            )}
          </View>);


      case 'subjects':
        return (
          <View className="space-y-3">
            {subjects.map((subject) =>
            <View key={subject.id} className={cn('p-4 rounded-2xl border', colors.backgroundElevated, colors.border)}>
                <Text className={cn('text-lg font-semibold', colors.textPrimary)}>
                  {subject.name} ({subject.code})
                </Text>
                {subject.description &&
              <Text className={cn('text-sm mt-1', colors.textSecondary)}>
                    {subject.description}
                  </Text>
              }
                {subject.level &&
              <Text className={cn('text-sm', colors.textSecondary)}>
                    Level: {subject.level.name}
                  </Text>
              }
              </View>
            )}
          </View>);

    }
  };

  const renderCreateForm = () => {
    switch (activeTab) {
      case 'levels':
        return (
          <View className={cn('p-5 rounded-2xl border space-y-4', colors.backgroundElevated, colors.border)}>
            <Text className={cn('text-xl font-semibold mb-4', colors.textPrimary)}>
              Create New Level
            </Text>
            
            <View>
              <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>Name *</Text>
              <TextInput
                value={levelForm.name}
                onChangeText={(text) => setLevelForm({ ...levelForm, name: text })}
                className={cn('p-3 rounded-xl border', colors.border, colors.background, colors.textPrimary)}
                placeholder="e.g., Primary School" />

            </View>
            
            <View>
              <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>Short Name *</Text>
              <TextInput
                value={levelForm.short_name}
                onChangeText={(text) => setLevelForm({ ...levelForm, short_name: text })}
                className={cn('p-3 rounded-xl border', colors.border, colors.background, colors.textPrimary)}
                placeholder="e.g., PRIMARY" />

            </View>
            
            <View>
              <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>{t("homework.description")}</Text>
              <TextInput
                value={levelForm.description}
                onChangeText={(text) => setLevelForm({ ...levelForm, description: text })}
                className={cn('p-3 rounded-xl border', colors.border, colors.background, colors.textPrimary)}
                placeholder="Optional description"
                multiline />

            </View>
            
            <View className="flex-row space-x-3 pt-2">
              <TouchableOpacity
                onPress={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 items-center">

                <Text className={cn('font-medium', colors.textPrimary)}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleCreateLevel}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-500 items-center">

                <Text className="text-white font-medium">Create Level</Text>
              </TouchableOpacity>
            </View>
          </View>);


      case 'classes':
        return (
          <View className={cn('p-5 rounded-2xl border space-y-4', colors.backgroundElevated, colors.border)}>
            <Text className={cn('text-xl font-semibold mb-4', colors.textPrimary)}>
              Create New Class
            </Text>
            
            <View>
              <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>Name *</Text>
              <TextInput
                value={classForm.name}
                onChangeText={(text) => setClassForm({ ...classForm, name: text })}
                className={cn('p-3 rounded-xl border', colors.border, colors.background, colors.textPrimary)}
                placeholder="e.g., 10A" />

            </View>
            
            <View>
              <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>Level *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {levels.map((level) =>
                  <TouchableOpacity
                    key={level.id}
                    onPress={() => setClassForm({ ...classForm, level_id: level.id })}
                    className={cn(
                      'px-4 py-2 rounded-full border',
                      classForm.level_id === level.id ? 'bg-blue-500 border-blue-500' : colors.border
                    )}>

                      <Text className={
                    classForm.level_id === level.id ?
                    'text-white text-sm' :
                    cn('text-sm', colors.textPrimary)
                    }>
                        {level.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
            
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>Grade *</Text>
                <TextInput
                  value={classForm.grade}
                  onChangeText={(text) => setClassForm({ ...classForm, grade: text })}
                  className={cn('p-3 rounded-xl border', colors.border, colors.background, colors.textPrimary)}
                  placeholder="e.g., 10" />

              </View>
              
              <View className="flex-1">
                <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>Section *</Text>
                <TextInput
                  value={classForm.section}
                  onChangeText={(text) => setClassForm({ ...classForm, section: text })}
                  className={cn('p-3 rounded-xl border', colors.border, colors.background, colors.textPrimary)}
                  placeholder="e.g., A" />

              </View>
            </View>
            
            <View className="flex-row space-x-3 pt-2">
              <TouchableOpacity
                onPress={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 items-center">

                <Text className={cn('font-medium', colors.textPrimary)}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleCreateClass}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-500 items-center">

                <Text className="text-white font-medium">Create Class</Text>
              </TouchableOpacity>
            </View>
          </View>);


      case 'subjects':
        return (
          <View className={cn('p-5 rounded-2xl border space-y-4', colors.backgroundElevated, colors.border)}>
            <Text className={cn('text-xl font-semibold mb-4', colors.textPrimary)}>
              Create New Subject
            </Text>
            
            <View>
              <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>Name *</Text>
              <TextInput
                value={subjectForm.name}
                onChangeText={(text) => setSubjectForm({ ...subjectForm, name: text })}
                className={cn('p-3 rounded-xl border', colors.border, colors.background, colors.textPrimary)}
                placeholder="e.g., Mathematics" />

            </View>
            
            <View>
              <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>Code *</Text>
              <TextInput
                value={subjectForm.code}
                onChangeText={(text) => setSubjectForm({ ...subjectForm, code: text })}
                className={cn('p-3 rounded-xl border', colors.border, colors.background, colors.textPrimary)}
                placeholder="e.g., MATH" />

            </View>
            
            <View>
              <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>Level *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row space-x-2">
                  {levels.map((level) =>
                  <TouchableOpacity
                    key={level.id}
                    onPress={() => setSubjectForm({ ...subjectForm, level_id: level.id })}
                    className={cn(
                      'px-4 py-2 rounded-full border',
                      subjectForm.level_id === level.id ? 'bg-blue-500 border-blue-500' : colors.border
                    )}>

                      <Text className={
                    subjectForm.level_id === level.id ?
                    'text-white text-sm' :
                    cn('text-sm', colors.textPrimary)
                    }>
                        {level.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
            
            <View>
              <Text className={cn('text-sm font-medium mb-2', colors.textPrimary)}>{t("homework.description")}</Text>
              <TextInput
                value={subjectForm.description}
                onChangeText={(text) => setSubjectForm({ ...subjectForm, description: text })}
                className={cn('p-3 rounded-xl border', colors.border, colors.background, colors.textPrimary)}
                placeholder="Optional description"
                multiline />

            </View>
            
            <View className="flex-row space-x-3 pt-2">
              <TouchableOpacity
                onPress={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 items-center">

                <Text className={cn('font-medium', colors.textPrimary)}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleCreateSubject}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-500 items-center">

                <Text className="text-white font-medium">Create Subject</Text>
              </TouchableOpacity>
            </View>
          </View>);

    }
  };

  return (
    <View className={cn('flex-1', colors.background)}>
      {/* Header */}
      <View className={cn('px-6 pt-12 pb-6 border-b', colors.background, colors.border)}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className={cn('text-3xl font-bold tracking-tight', colors.textPrimary)}>
              System Settings
            </Text>
            <Text className={cn('text-lg opacity-70 mt-1', colors.textSecondary)}>
              Manage school structure and configuration
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row space-x-2">
          {(['levels', 'classes', 'subjects'] as const).map((tab) =>
          <TouchableOpacity
            key={tab}
            onPress={() => {
              setActiveTab(tab);
              setShowCreateForm(false);
            }}
            className={cn(
              'px-4 py-2 rounded-full border',
              activeTab === tab ? 'bg-blue-500 border-blue-500' : colors.border
            )}>

              <Text className={
            activeTab === tab ?
            'text-white font-medium text-sm' :
            cn('font-medium text-sm', colors.textPrimary)
            }>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Create Button */}
        {!showCreateForm &&
        <TouchableOpacity
          onPress={() => setShowCreateForm(true)}
          className={cn('p-4 rounded-2xl border mb-6 flex-row items-center justify-center space-x-2', colors.backgroundElevated, colors.border)}>

            <Ionicons name="add" size={20} className="text-blue-500" />
            <Text className="text-blue-500 font-semibold text-lg">
              Create New {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
            </Text>
          </TouchableOpacity>
        }

        {/* Content */}
        {renderContent()}
      </ScrollView>
    </View>);

}