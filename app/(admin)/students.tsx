// app/(admin)/students.tsx - Fixed version
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Alert } from '@/utils/UniversalAlert';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function StudentsManagementScreen() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [assigning, setAssigning] = useState(false);
  const { colors } = useThemeContext();
  

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

      // Create or update student record with class assignment
      const studentData = {
        user_id: selectedStudent.id,
        full_name: selectedStudent.profile?.name || selectedStudent.email,
        class_id: classObj.id,
        level_id: classObj.level_id,
        metadata: {
          class_name: classObj.name,
          grade: classObj.grade,
          section: classObj.section
        }
      };

      console.log('📦 Student data to create:', studentData);

      // First, check if student record already exists
      const existingStudentsRes = await apiService.getStudents();
      const existingStudent = existingStudentsRes.data.data?.find(
        (s: any) => s.user_id === selectedStudent.id
      );

      if (existingStudent) {
        // Update existing student
        await apiService.updateStudent(existingStudent.id, {
          class_id: classObj.id,
          level_id: classObj.level_id,
          metadata: {
            ...existingStudent.metadata,
            class_name: classObj.name,
            grade: classObj.grade,
            section: classObj.section
          }
        });
      } else {
        // Create new student record
        await apiService.createStudent(studentData);
      }

      // Also update user profile with class info
      await apiService.updateUserProfile(selectedStudent.id, {
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

  // Alternative simpler approach if the above doesn't work
  // In students.tsx - replace the handleAssignClassSimple function
  const handleAssignClassSimple = async () => {
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

      // Use the admin endpoint to update student class
      const response = await apiService.updateStudentClass(selectedStudent.id, classObj.name);

      console.log('✅ Assignment response:', response.data);

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
      // Use the correct API method for deleting users
      await apiService.deleteUser(studentId);
      Alert.alert('Success', 'Student deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Delete student error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'Failed to delete student'
      );
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
      <View className={cn('flex-1 justify-center items-center', colors.background)}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={cn('text-lg mt-4', colors.textSecondary)}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View className={cn('flex-1', colors.background)}>
      {/* Header - Fixed */}
      <View className={cn('px-6 pt-12 pb-6 border-b', colors.background, colors.border)}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className={cn('text-3xl font-bold tracking-tight', colors.textPrimary)}>
              Student Management
            </Text>
            <Text className={cn('text-lg opacity-70 mt-1', colors.textSecondary)}>
              Manage student assignments and classes
            </Text>
          </View>
          <TouchableOpacity
            onPress={loadData}
            className={cn('w-10 h-10 rounded-full items-center justify-center', colors.backgroundElevated)}
          >
            <Ionicons name="refresh" size={20} className={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row space-x-4">
          <View className={cn('flex-1 p-4 rounded-2xl border', colors.backgroundElevated, colors.border)}>
            <Text className={cn('text-2xl font-bold mb-1', colors.textPrimary)}>
              {students.length}
            </Text>
            <Text className={cn('text-sm', colors.textSecondary)}>Total Students</Text>
          </View>
          <View className={cn('flex-1 p-4 rounded-2xl border', colors.backgroundElevated, colors.border)}>
            <Text className={cn('text-2xl font-bold mb-1', colors.textPrimary)}>
              {students.filter(s => s.is_approved).length}
            </Text>
            <Text className={cn('text-sm', colors.textSecondary)}>Approved</Text>
          </View>
          <View className={cn('flex-1 p-4 rounded-2xl border', colors.backgroundElevated, colors.border)}>
            <Text className={cn('text-2xl font-bold mb-1', colors.textPrimary)}>
              {students.filter(s => s.profile?.class).length}
            </Text>
            <Text className={cn('text-sm', colors.textSecondary)}>Assigned</Text>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6 space-y-4">
          {students.map(student => (
            <View
              key={student.id}
              className={cn(
                'p-5 rounded-2xl border',
                colors.backgroundElevated,
                colors.border
              )}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-start space-x-4 flex-1">
                  <View className="w-12 h-12 bg-blue-500/10 rounded-xl items-center justify-center">
                    <Ionicons name="person" size={24} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text className={cn('text-lg font-semibold mb-1', colors.textPrimary)}>
                      {student.profile?.name || 'No Name'}
                    </Text>
                    <Text className={cn('text-sm mb-2', colors.textSecondary)}>
                      {student.email}
                    </Text>

                    <View className="flex-row flex-wrap gap-2 mb-3">
                      <View className="px-3 py-1 bg-blue-500/10 rounded-full">
                        <Text className="text-blue-600 text-xs font-medium">
                          ID: {student.student_id || 'N/A'}
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${student.profile?.class ? 'bg-green-500/10' : 'bg-gray-500/10'
                        }`}>
                        <Text className={`text-xs font-medium ${student.profile?.class ? 'text-green-600' : 'text-gray-600'
                          }`}>
                          {student.profile?.class || 'No class'}
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${student.is_approved ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                        }`}>
                        <Text className={`text-xs font-medium ${student.is_approved ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                          {student.is_approved ? 'Approved' : 'Pending'}
                        </Text>
                      </View>
                    </View>

                    {!student.is_approved && (
                      <TouchableOpacity
                        onPress={() => approveStudent(student)}
                        className="bg-emerald-500 px-4 py-2 rounded-xl self-start"
                      >
                        <Text className="text-white font-medium text-sm">Approve Student</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    onPress={() => openClassModal(student)}
                    className={cn(
                      'w-10 h-10 rounded-xl items-center justify-center',
                      student.is_approved ? 'bg-blue-500' : 'bg-gray-400'
                    )}
                    disabled={!student.is_approved}
                  >
                    <Ionicons name="school" size={18} color="white" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteStudent(student)}
                    className="w-10 h-10 rounded-xl bg-rose-500 items-center justify-center"
                  >
                    <Ionicons name="trash" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {students.length === 0 && (
            <View className={cn('items-center py-16 rounded-2xl border-2 border-dashed', colors.border)}>
              <Ionicons name="people-outline" size={64} className="opacity-30 mb-4" />
              <Text className={cn('text-2xl font-bold mb-2', colors.textPrimary)}>
                No Students
              </Text>
              <Text className={cn('text-center opacity-70 text-lg mb-6', colors.textSecondary)}>
                Students will appear here once they register
              </Text>
              <TouchableOpacity onPress={loadData} className="bg-blue-500 px-6 py-3 rounded-2xl">
                <Text className="text-white font-semibold text-lg">Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Class Assignment Modal */}
      <Modal visible={showClassModal} animationType="slide" presentationStyle="pageSheet">
        <View className={cn('flex-1', colors.background)}>
          <View className={cn('px-6 pt-8 pb-6 border-b', colors.background, colors.border)}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className={cn('text-2xl font-bold', colors.textPrimary)}>
                  Assign Class
                </Text>
                <Text className={cn('text-lg mt-2', colors.textSecondary)}>
                  {selectedStudent?.profile?.name || selectedStudent?.email}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowClassModal(false)}
                className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800"
              >
                <Ionicons name="close" size={20} className={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1">
            <View className="p-6 space-y-3">
              {classes.map(classItem => (
                <TouchableOpacity
                  key={classItem.id}
                  onPress={() => setSelectedClass(classItem.id)}
                  className={cn(
                    'p-4 rounded-2xl border flex-row items-center justify-between',
                    selectedClass === classItem.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300'
                      : colors.backgroundElevated,
                    colors.border
                  )}
                >
                  <View className="flex-row items-center space-x-4">
                    <View className="w-12 h-12 bg-blue-500/10 rounded-xl items-center justify-center">
                      <Ionicons name="school" size={24} color="#3b82f6" />
                    </View>
                    <View>
                      <Text className={cn('text-lg font-semibold', colors.textPrimary)}>
                        {classItem.name}
                      </Text>
                      <Text className={cn('text-sm', colors.textSecondary)}>
                        {classItem.level?.name} • Grade {classItem.grade} • Section {classItem.section}
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

          <View className={cn('p-6 border-t', colors.background, colors.border)}>
            <TouchableOpacity
              className={cn(
                'w-full py-4 rounded-2xl items-center',
                !selectedClass || assigning ? 'bg-blue-400' : 'bg-blue-500'
              )}
              onPress={handleAssignClassSimple}
              disabled={!selectedClass || assigning}
            >
              {assigning ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  Assign to Class
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}