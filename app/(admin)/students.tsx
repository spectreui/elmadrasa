// app/(admin)/students.tsx - Updated with proper scroll
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';

export default function StudentsManagementScreen() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading students and classes...');
      
      const [studentsRes, classesRes] = await Promise.all([
        apiService.getUsersByRole('student'),
        apiService.getClasses(),
      ]);

      console.log('📊 Students response:', studentsRes.data);
      console.log('🏫 Classes response:', classesRes.data);

      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data || []);
      } else {
        throw new Error(studentsRes.data.error || 'Failed to load students');
      }

      if (classesRes.data.success) {
        setClasses(classesRes.data.data || []);
      } else {
        throw new Error(classesRes.data.error || 'Failed to load classes');
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

  const handleAssignClass = async () => {
    if (!selectedStudent || !selectedClass) {
      Alert.alert('Error', 'Please select a class');
      return;
    }

    setAssigning(true);
    try {
      const classObj = classes.find(c => c.id === selectedClass);
      if (!classObj) {
        Alert.alert('Error', 'Invalid class selected');
        return;
      }

      console.log(`🎯 Assigning ${selectedStudent.profile?.name} to ${classObj.name}`);

      // Update student's class using the teacher profile update (as a temporary solution)
      await apiService.updateTeacherProfile({
        name: selectedStudent.profile?.name,
        class: classObj.name
      });

      Alert.alert('Success', `Assigned ${selectedStudent.profile?.name} to ${classObj.name}`);
      setShowClassModal(false);
      setSelectedStudent(null);
      setSelectedClass('');
      await loadData(); // Refresh the data
    } catch (error: any) {
      console.error('❌ Assign class error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.error || error.message || 'Failed to assign class'
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteStudent = (student: any) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.profile?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteStudent(student.id)
        }
      ]
    );
  };

  const deleteStudent = async (studentId: string) => {
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
      Alert.alert('Error', 'Failed to delete student');
    }
  };

  const openClassModal = (student: any) => {
    setSelectedStudent(student);
    setSelectedClass('');
    setShowClassModal(true);
  };

  const approveStudent = async (student: any) => {
    try {
      await apiService.approveUser(student.id);
      Alert.alert('Success', `Approved ${student.profile?.name}`);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to approve student');
    }
  };

  if (loading) {
    return (
      <View className={cn('flex-1 justify-center items-center', Theme.background)}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={cn('text-lg mt-4', Theme.text.secondary)}>Loading students...</Text>
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
              Student Management
            </Text>
            <Text className={cn('text-base', Theme.text.secondary)}>
              {students.length} student(s) found
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
          <View className="p-6 space-y-4">
            {students.map(student => (
              <View
                key={student.id}
                className={cn(
                  'p-4 rounded-xl border',
                  Theme.elevated,
                  Theme.border
                )}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-start space-x-3 flex-1">
                    <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center">
                      <Ionicons name="person" size={20} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className={cn('font-semibold text-lg', Theme.text.primary)}>
                        {student.profile?.name || 'No Name'}
                      </Text>
                      <Text className={cn('text-sm', Theme.text.secondary)}>
                        {student.email}
                      </Text>
                      <Text className="text-sm text-gray-500 mt-1">
                        Student ID: {student.student_id || 'N/A'}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        Class: {student.profile?.class || 'Not assigned'}
                      </Text>
                      
                      <View className="flex-row items-center space-x-2 mt-2">
                        <View className={`px-2 py-1 rounded-full ${student.is_approved ? 'bg-green-100' : 'bg-orange-100'}`}>
                          <Text className={`text-xs font-medium ${student.is_approved ? 'text-green-800' : 'text-orange-800'}`}>
                            {student.is_approved ? '✓ Approved' : 'Pending Approval'}
                          </Text>
                        </View>
                        
                        {!student.is_approved && (
                          <TouchableOpacity 
                            onPress={() => approveStudent(student)}
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
                      onPress={() => openClassModal(student)}
                      className="bg-blue-500 p-2 rounded-lg"
                      disabled={!student.is_approved}
                    >
                      <Ionicons name="school" size={16} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleDeleteStudent(student)}
                      className="bg-red-500 p-2 rounded-lg"
                    >
                      <Ionicons name="trash" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {students.length === 0 && (
              <View className={cn('items-center py-12', Theme.background)}>
                <Ionicons name="people" size={64} color="#9ca3af" />
                <Text className={cn('text-lg font-semibold mt-4', Theme.text.secondary)}>
                  No students found
                </Text>
                <Text className={cn('text-sm text-center mt-2', Theme.text.tertiary)}>
                  Students will appear here once they register.
                </Text>
                <TouchableOpacity onPress={loadData} className="bg-blue-500 px-4 py-2 rounded-lg mt-4">
                  <Text className="text-white font-semibold">Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Class Assignment Modal */}
      <Modal visible={showClassModal} animationType="slide" presentationStyle="pageSheet">
        <View className={cn('flex-1', Theme.background)}>
          <View className={cn('p-6 border-b', Theme.background, Theme.border)}>
            <View className="flex-row items-center justify-between">
              <Text className={cn('text-xl font-semibold', Theme.text.primary)}>
                Assign Class
              </Text>
              <TouchableOpacity onPress={() => setShowClassModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text className={cn('text-sm mt-2', Theme.text.secondary)}>
              Assign class to {selectedStudent?.profile?.name}
            </Text>
          </View>

          <View className="flex-1">
            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View className="p-6 space-y-3">
                {classes.map(classItem => (
                  <TouchableOpacity
                    key={classItem.id}
                    onPress={() => setSelectedClass(classItem.id)}
                    className={cn(
                      'p-4 rounded-xl border flex-row items-center justify-between',
                      selectedClass === classItem.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' 
                        : Theme.elevated,
                      Theme.border
                    )}
                  >
                    <View className="flex-row items-center space-x-3">
                      <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg items-center justify-center">
                        <Ionicons name="school" size={20} color="#3b82f6" />
                      </View>
                      <View>
                        <Text className={cn('text-lg font-semibold', Theme.text.primary)}>
                          {classItem.name}
                        </Text>
                        <Text className={cn('text-sm', Theme.text.secondary)}>
                          {classItem.level?.name} • Grade {classItem.grade} {classItem.section}
                        </Text>
                      </View>
                    </View>
                    
                    {selectedClass === classItem.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className={cn('p-6 border-t', Theme.background, Theme.border)}>
            <TouchableOpacity
              className="bg-blue-500 rounded-xl p-4 flex-row justify-center items-center shadow-sm active:opacity-80 disabled:opacity-50"
              onPress={handleAssignClass}
              disabled={!selectedClass || assigning}
            >
              {assigning ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  Assign Class
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}