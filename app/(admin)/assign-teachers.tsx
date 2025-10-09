// app/(admin)/assign-teachers.tsx - Updated for your schema
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';

export default function AssignTeachersScreen() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('SEC');
  const [loading, setLoading] = useState(true);
  const [selectedClassSubject, setSelectedClassSubject] = useState<{classId: string, subjectId: string} | null>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedLevel]);

  const loadData = async () => {
    try {
      const [levelsRes, classesRes, subjectsRes, teachersRes, assignmentsRes] = await Promise.all([
        apiService.getLevels(),
        apiService.getClasses(),
        apiService.getSubjects(),
        apiService.getUsersByRole('teacher'),
        apiService.getTeacherAssignments(),
      ]);

      setLevels(levelsRes.data.data || []);
      setClasses(classesRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
      setTeachers(teachersRes.data.data || []);
      setAssignments(assignmentsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getClassesForLevel = (levelShortName: string) => {
    const level = levels.find(l => l.short_name === levelShortName);
    return classes.filter(c => c.level_id === level?.id);
  };

  const getSubjectsForLevel = (levelShortName: string) => {
    const level = levels.find(l => l.short_name === levelShortName);
    return subjects.filter(s => s.level_id === level?.id);
  };

  const getAssignmentForClassSubject = (classId: string, subjectId: string) => {
    return assignments.find(a => a.class_id === classId && a.subject_id === subjectId);
  };

  const handleAssignTeacher = (classId: string, subjectId: string) => {
    setSelectedClassSubject({ classId, subjectId });
    setShowTeacherModal(true);
  };

  const confirmAssignment = async (teacherId: string) => {
    if (!selectedClassSubject) return;

    try {
      const response = await apiService.assignTeacherToClass({
        teacher_id: teacherId,
        class_id: selectedClassSubject.classId,
        subject_id: selectedClassSubject.subjectId,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Teacher assigned successfully!');
        setShowTeacherModal(false);
        setSelectedClassSubject(null);
        loadData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to assign teacher');
    }
  };

  const levelClasses = getClassesForLevel(selectedLevel);
  const levelSubjects = getSubjectsForLevel(selectedLevel);

  return (
    <View className={cn('flex-1', Theme.background)}>
      {/* Header */}
      <View className={cn('p-6 border-b', Theme.background, Theme.border)}>
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <View>
            <Text className={cn('text-2xl font-bold', Theme.text.primary)}>
              Assign Teachers
            </Text>
            <Text className={cn('text-base', Theme.text.secondary)}>
              Link teachers to classes and subjects
            </Text>
          </View>
        </View>

        {/* Level Selector */}
        <View className="flex-row space-x-2 mt-4">
          {levels.map(level => (
            <TouchableOpacity
              key={level.id}
              onPress={() => setSelectedLevel(level.short_name)}
              className={cn(
                'px-4 py-2 rounded-lg',
                selectedLevel === level.short_name
                  ? 'bg-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            >
              <Text className={
                selectedLevel === level.short_name
                  ? 'text-white font-semibold'
                  : cn('font-medium', Theme.text.primary)
              }>
                {level.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {levelClasses.map(classItem => (
            <View key={classItem.id} className="mb-8">
              <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>
                {classItem.name}
              </Text>
              
              <View className="space-y-3">
                {levelSubjects.map(subject => {
                  const assignment = getAssignmentForClassSubject(classItem.id, subject.id);
                  
                  return (
                    <View
                      key={subject.id}
                      className={cn(
                        'p-4 rounded-xl border',
                        Theme.elevated,
                        Theme.border
                      )}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center space-x-3 flex-1">
                          <View className="w-10 h-10 rounded-lg bg-blue-500 items-center justify-center">
                            <Ionicons name="book" size={20} color="white" />
                          </View>
                          <View className="flex-1">
                            <Text className={cn('font-semibold', Theme.text.primary)}>
                              {subject.name}
                            </Text>
                            {assignment ? (
                              <View className="flex-row items-center space-x-2">
                                <Text className={cn('text-sm', Theme.text.secondary)}>
                                  {assignment.teacher_name}
                                </Text>
                                <Text className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                  {assignment.code}
                                </Text>
                              </View>
                            ) : (
                              <Text className="text-sm text-orange-500">
                                Not assigned
                              </Text>
                            )}
                          </View>
                        </View>
                        
                        <TouchableOpacity
                          onPress={() => handleAssignTeacher(classItem.id, subject.id)}
                          className={cn(
                            'p-2 rounded-lg',
                            assignment 
                              ? 'bg-red-50 dark:bg-red-900/20' 
                              : 'bg-blue-50 dark:bg-blue-900/20'
                          )}
                        >
                          <Ionicons 
                            name={assignment ? "trash" : "add"} 
                            size={16} 
                            color={assignment ? "#ef4444" : "#3b82f6"} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Teacher Selection Modal */}
      <Modal visible={showTeacherModal} animationType="slide" presentationStyle="pageSheet">
        <View className={cn('flex-1', Theme.background)}>
          <View className={cn('p-6 border-b', Theme.background, Theme.border)}>
            <View className="flex-row items-center justify-between">
              <Text className={cn('text-xl font-semibold', Theme.text.primary)}>
                Select Teacher
              </Text>
              <TouchableOpacity onPress={() => setShowTeacherModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView>
            <View className="p-6 space-y-3">
              {teachers.map(teacher => (
                <TouchableOpacity
                  key={teacher.id}
                  onPress={() => confirmAssignment(teacher.id)}
                  className={cn(
                    'p-4 rounded-xl border flex-row items-center space-x-3',
                    Theme.elevated,
                    Theme.border
                  )}
                >
                  <View className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center">
                    <Ionicons name="person" size={20} color="#6b7280" />
                  </View>
                  <View>
                    <Text className={cn('font-semibold', Theme.text.primary)}>
                      {teacher.profile?.name || teacher.email}
                    </Text>
                    <Text className={cn('text-sm', Theme.text.secondary)}>
                      {teacher.email}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}