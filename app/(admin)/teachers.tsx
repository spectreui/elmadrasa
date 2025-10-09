// app/(admin)/teachers.tsx - Updated with proper scroll
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';

export default function TeachersManagementScreen() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading teachers data...');
      
      const [teachersRes, classesRes, subjectsRes, assignmentsRes] = await Promise.all([
        apiService.getUsersByRole('teacher'),
        apiService.getClasses(),
        apiService.getSubjects(),
        apiService.getTeacherAssignments(),
      ]);

      console.log('👨‍🏫 Teachers:', teachersRes.data);
      console.log('🏫 Classes:', classesRes.data);
      console.log('📚 Subjects:', subjectsRes.data);
      console.log('🔗 Assignments:', assignmentsRes.data);

      if (teachersRes.data.success) {
        setTeachers(teachersRes.data.data || []);
      } else {
        throw new Error(teachersRes.data.error || 'Failed to load teachers');
      }

      if (classesRes.data.success) {
        setClasses(classesRes.data.data || []);
      }

      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.data || []);
      }

      if (assignmentsRes.data.success) {
        setTeacherAssignments(assignmentsRes.data.data || []);
      }

    } catch (error: any) {
      console.error('❌ Failed to load data:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.error || error.message || 'Failed to load data'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTeacherAssignments = (teacherId: string) => {
    return teacherAssignments.filter(assignment => assignment.teacher_id === teacherId);
  };

  const openAssignmentModal = (teacher: any) => {
    setSelectedTeacher(teacher);
    setSelectedClass('');
    setSelectedSubject('');
    setShowAssignmentModal(true);
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !selectedClass || !selectedSubject) {
      Alert.alert('Error', 'Please select both class and subject');
      return;
    }

    setAssigning(true);
    try {
      const classObj = classes.find(c => c.id === selectedClass);
      const subjectObj = subjects.find(s => s.id === selectedSubject);

      if (!classObj || !subjectObj) {
        Alert.alert('Error', 'Invalid class or subject selected');
        return;
      }

      console.log(`🎯 Assigning ${selectedTeacher.profile?.name} to ${subjectObj.name} in ${classObj.name}`);

      await apiService.assignTeacherToClass({
        teacher_id: selectedTeacher.id,
        class_id: selectedClass,
        subject_id: selectedSubject
      });

      Alert.alert('Success', `Assigned ${selectedTeacher.profile?.name} to ${subjectObj.name} in ${classObj.name}`);
      setShowAssignmentModal(false);
      setSelectedTeacher(null);
      setSelectedClass('');
      setSelectedSubject('');
      await loadData(); // Refresh the data
    } catch (error: any) {
      console.error('❌ Assign teacher error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.error || error.message || 'Failed to assign teacher'
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteTeacher = (teacher: any) => {
    Alert.alert(
      'Delete Teacher',
      `Are you sure you want to delete ${teacher.profile?.name}? This will remove all their assignments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTeacher(teacher.id)
        }
      ]
    );
  };

  const deleteTeacher = async (teacherId: string) => {
    try {
      Alert.alert(
        'Info', 
        'Delete functionality requires a backend endpoint. Would you like to refresh the data instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Refresh', onPress: loadData }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to delete teacher');
    }
  };

  const removeAssignment = async (assignmentId: string, teacherName: string, className: string, subjectName: string) => {
    Alert.alert(
      'Remove Assignment',
      `Remove ${teacherName} from ${subjectName} in ${className}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: You'll need to create a remove assignment endpoint
              Alert.alert('Info', 'Remove assignment functionality would be implemented here');
              // await apiService.removeTeacherAssignment(assignmentId);
              // loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove assignment');
            }
          }
        }
      ]
    );
  };

  const approveTeacher = async (teacher: any) => {
    try {
      await apiService.approveUser(teacher.id);
      Alert.alert('Success', `Approved ${teacher.profile?.name}`);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to approve teacher');
    }
  };

  const getFilteredSubjects = () => {
    if (!selectedClass) return subjects;
    
    const selectedClassObj = classes.find(c => c.id === selectedClass);
    if (!selectedClassObj) return subjects;
    
    return subjects.filter(subject => subject.level_id === selectedClassObj.level_id);
  };

  if (loading) {
    return (
      <View className={cn('flex-1 justify-center items-center', Theme.background)}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={cn('text-lg mt-4', Theme.text.secondary)}>Loading teachers...</Text>
      </View>
    );
  }

  return (
    <View className={cn('flex-1', Theme.background)}>
      {/* Header - Fixed */}
      <View className={cn('p-6 border-b', Theme.background, Theme.border)}>
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className={cn('text-2xl font-bold', Theme.text.primary)}>
              Teacher Management
            </Text>
            <Text className={cn('text-base', Theme.text.secondary)}>
              {teachers.length} teacher(s) found
            </Text>
          </View>
          <TouchableOpacity onPress={loadData} className="bg-blue-500 p-2 rounded-lg">
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <View className="flex-1">
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="p-6 space-y-6">
            {teachers.map(teacher => {
              const assignments = getTeacherAssignments(teacher.id);
              
              return (
                <View
                  key={teacher.id}
                  className={cn(
                    'p-4 rounded-xl border',
                    Theme.elevated,
                    Theme.border
                  )}
                >
                  {/* Teacher Info */}
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-row items-start space-x-3 flex-1">
                      <View className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full items-center justify-center">
                        <Ionicons name="person" size={20} color="#10b981" />
                      </View>
                      <View className="flex-1">
                        <Text className={cn('font-semibold text-lg', Theme.text.primary)}>
                          {teacher.profile?.name || 'No Name'}
                        </Text>
                        <Text className={cn('text-sm', Theme.text.secondary)}>
                          {teacher.email}
                        </Text>
                        <Text className="text-sm text-gray-500 mt-1">
                          Department: {teacher.profile?.department || 'Not specified'}
                        </Text>
                        
                        <View className="flex-row items-center space-x-2 mt-2">
                          <View className={`px-2 py-1 rounded-full ${teacher.is_approved ? 'bg-green-100' : 'bg-orange-100'}`}>
                            <Text className={`text-xs font-medium ${teacher.is_approved ? 'text-green-800' : 'text-orange-800'}`}>
                              {teacher.is_approved ? '✓ Approved' : 'Pending Approval'}
                            </Text>
                          </View>
                          
                          {!teacher.is_approved && (
                            <TouchableOpacity 
                              onPress={() => approveTeacher(teacher)}
                              className="bg-green-500 px-3 py-1 rounded-full"
                            >
                              <Text className="text-white text-xs font-medium">Approve</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>

                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        onPress={() => openAssignmentModal(teacher)}
                        className="bg-blue-500 p-2 rounded-lg"
                        disabled={!teacher.is_approved}
                      >
                        <Ionicons name="add" size={16} color="white" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleDeleteTeacher(teacher)}
                        className="bg-red-500 p-2 rounded-lg"
                      >
                        <Ionicons name="trash" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Current Assignments */}
                  {assignments.length > 0 ? (
                    <View className="mt-4">
                      <Text className={cn('font-semibold mb-2', Theme.text.primary)}>
                        Current Assignments ({assignments.length})
                      </Text>
                      <View className="space-y-2">
                        {assignments.map(assignment => (
                          <View
                            key={assignment.id}
                            className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex-row items-center justify-between"
                          >
                            <View className="flex-1">
                              <Text className="text-blue-800 dark:text-blue-300 font-medium">
                                {assignment.subject?.name}
                              </Text>
                              <Text className="text-blue-600 dark:text-blue-400 text-sm">
                                Class: {assignment.class?.name}
                              </Text>
                              <Text className="text-blue-500 dark:text-blue-300 text-xs">
                                Join Code: {assignment.code}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => removeAssignment(
                                assignment.id,
                                teacher.profile?.name,
                                assignment.class?.name,
                                assignment.subject?.name
                              )}
                              className="bg-red-500 p-1 rounded"
                            >
                              <Ionicons name="close" size={14} color="white" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mt-4">
                      <Text className="text-gray-600 dark:text-gray-400 text-sm text-center">
                        No assignments yet
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {teachers.length === 0 && (
              <View className={cn('items-center py-12', Theme.background)}>
                <Ionicons name="person" size={64} color="#9ca3af" />
                <Text className={cn('text-lg font-semibold mt-4', Theme.text.secondary)}>
                  No teachers found
                </Text>
                <Text className={cn('text-sm text-center mt-2', Theme.text.tertiary)}>
                  Teachers will appear here once they register.
                </Text>
                <TouchableOpacity onPress={loadData} className="bg-blue-500 px-4 py-2 rounded-lg mt-4">
                  <Text className="text-white font-semibold">Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Assignment Modal */}
      <Modal visible={showAssignmentModal} animationType="slide" presentationStyle="pageSheet">
        <View className={cn('flex-1', Theme.background)}>
          <View className={cn('p-6 border-b', Theme.background, Theme.border)}>
            <View className="flex-row items-center justify-between">
              <Text className={cn('text-xl font-semibold', Theme.text.primary)}>
                Assign Teacher
              </Text>
              <TouchableOpacity onPress={() => setShowAssignmentModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text className={cn('text-sm mt-2', Theme.text.secondary)}>
              Assign {selectedTeacher?.profile?.name} to a class and subject
            </Text>
          </View>

          <View className="flex-1">
            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View className="p-6 space-y-6">
                {/* Class Selection */}
                <View>
                  <Text className={cn('font-semibold mb-3', Theme.text.primary)}>
                    Select Class
                  </Text>
                  <View className="space-y-2">
                    {classes.map(classItem => (
                      <TouchableOpacity
                        key={classItem.id}
                        onPress={() => {
                          setSelectedClass(classItem.id);
                          setSelectedSubject(''); // Reset subject when class changes
                        }}
                        className={cn(
                          'p-3 rounded-xl border flex-row items-center justify-between',
                          selectedClass === classItem.id 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' 
                            : Theme.elevated,
                          Theme.border
                        )}
                      >
                        <View className="flex-row items-center space-x-3">
                          <View className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg items-center justify-center">
                            <Ionicons name="school" size={16} color="#3b82f6" />
                          </View>
                          <View>
                            <Text className={cn('font-medium', Theme.text.primary)}>
                              {classItem.name}
                            </Text>
                            <Text className={cn('text-xs', Theme.text.secondary)}>
                              {classItem.level?.name} • Grade {classItem.grade}
                            </Text>
                          </View>
                        </View>
                        
                        {selectedClass === classItem.id && (
                          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Subject Selection */}
                <View>
                  <Text className={cn('font-semibold mb-3', Theme.text.primary)}>
                    Select Subject
                  </Text>
                  {!selectedClass ? (
                    <View className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl">
                      <Text className="text-yellow-800 dark:text-yellow-200 text-sm">
                        Please select a class first to see available subjects
                      </Text>
                    </View>
                  ) : (
                    <View className="space-y-2">
                      {getFilteredSubjects().map(subject => (
                        <TouchableOpacity
                          key={subject.id}
                          onPress={() => setSelectedSubject(subject.id)}
                          className={cn(
                            'p-3 rounded-xl border flex-row items-center justify-between',
                            selectedSubject === subject.id 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-300' 
                              : Theme.elevated,
                            Theme.border
                          )}
                        >
                          <View className="flex-row items-center space-x-3">
                            <View 
                              className="w-8 h-8 rounded-lg items-center justify-center"
                              style={{ backgroundColor: subject.color || '#10b981' }}
                            >
                              <Ionicons 
                                name={subject.icon as any || 'book'} 
                                size={16} 
                                color="white" 
                              />
                            </View>
                            <View>
                              <Text className={cn('font-medium', Theme.text.primary)}>
                                {subject.name}
                              </Text>
                              <Text className={cn('text-xs', Theme.text.secondary)}>
                                {subject.code}
                              </Text>
                            </View>
                          </View>
                          
                          {selectedSubject === subject.id && (
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>

          <View className={cn('p-6 border-t', Theme.background, Theme.border)}>
            <TouchableOpacity
              className="bg-blue-500 rounded-xl p-4 flex-row justify-center items-center shadow-sm active:opacity-80 disabled:opacity-50"
              onPress={handleAssignTeacher}
              disabled={!selectedClass || !selectedSubject || assigning}
            >
              {assigning ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  Assign Teacher
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}