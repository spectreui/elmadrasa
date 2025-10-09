// app/(admin)/classes.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';
import { Picker } from '@react-native-picker/picker';

export default function ClassesManagementScreen() {
  const [classes, setClasses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [classTeachers, setClassTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level_id: '',
    grade: '',
    section: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Auto-generate class name when level, grade, or section changes
  useEffect(() => {
    if (formData.level_id && formData.grade && formData.section) {
      const level = levels.find(l => l.id === formData.level_id);
      if (level) {
        let className = '';
        
        // Map grade numbers based on level
        if (level.short_name === 'PREP') {
          className = `Prep ${formData.grade}${formData.section}`;
        } else if (level.short_name === 'PRI') {
          className = `Primary ${formData.grade}${formData.section}`;
        } else if (level.short_name === 'SEC') {
          // For secondary, map 1->10, 2->11, 3->12
          const gradeMap = { '1': '10', '2': '11', '3': '12' };
          className = `${gradeMap[formData.grade as keyof typeof gradeMap]}${formData.section}`;
        }
        
        setFormData(prev => ({ ...prev, name: className }));
      }
    }
  }, [formData.level_id, formData.grade, formData.section, levels]);

  const loadData = async () => {
    try {
      const [classesRes, levelsRes] = await Promise.all([
        apiService.getClasses(),
        apiService.getLevels(),
      ]);
      
      setClasses(classesRes.data.data || []);
      setLevels(levelsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadClassDetails = async (classItem: any) => {
    try {
      setDetailsLoading(true);
      setSelectedClass(classItem);
      
      // Load students for this class
      const studentsRes = await apiService.getClassStudents(classItem.id);
      setClassStudents(studentsRes.data.data || []);
      
      // Load teacher assignments for this class
      const assignmentsRes = await apiService.getTeacherAssignments();
      const classTeachers = (assignmentsRes.data.data || [])
        .filter((assignment: any) => assignment.class_id === classItem.id)
        .map((assignment: any) => ({
          teacher: assignment.teacher,
          subject: assignment.subject,
          assignmentId: assignment.id
        }));
      
      setClassTeachers(classTeachers);
      setShowClassDetails(true);
    } catch (error: any) {
      console.error('Failed to load class details:', error);
      Alert.alert('Error', `Failed to load class details: ${error.message}`);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!formData.name || !formData.level_id || !formData.grade || !formData.section) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      
      // Prepare the data with all required fields
      const classData = {
        name: formData.name,
        level_id: formData.level_id,
        grade: formData.grade,
        section: formData.section,
        ...(formData.description && { metadata: { description: formData.description } })
      };

      console.log('Creating class with data:', classData);
      await apiService.createClass(classData);
      
      Alert.alert('Success', 'Class created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', level_id: '', grade: '', section: '', description: '' });
      loadData();
    } catch (error: any) {
      console.error('Create class error:', error);
      if (error.response?.data.error === "duplicate key value violates unique constraint \"classes_name_unique\"") Alert.alert("Error", "Class already Exists!")
      else Alert.alert('Error', error.response?.data?.error || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const getGradeOptions = (levelId: string) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return [];

    switch (level.short_name) {
      case 'PREP':
        return [
          { label: 'Prep 1', value: '1' },
          { label: 'Prep 2', value: '2' },
          { label: 'Prep 3', value: '3' }
        ];
      case 'PRI':
        return [
          { label: 'Primary 1', value: '1' },
          { label: 'Primary 2', value: '2' },
          { label: 'Primary 3', value: '3' },
          { label: 'Primary 4', value: '4' },
          { label: 'Primary 5', value: '5' },
          { label: 'Primary 6', value: '6' }
        ];
      case 'SEC':
        return [
          { label: 'Secondary 1 (Grade 10)', value: '1' },
          { label: 'Secondary 2 (Grade 11)', value: '2' },
          { label: 'Secondary 3 (Grade 12)', value: '3' }
        ];
      default:
        return [];
    }
  };

  const getSectionOptions = () => {
    return [
      { label: 'Section A', value: 'A' },
      { label: 'Section B', value: 'B' },
      { label: 'Section C', value: 'C' },
      { label: 'Section D', value: 'D' }
    ];
  };

  const getDisplayGrade = (classItem: any) => {
    if (!classItem.level) return `Grade ${classItem.grade}`;
    
    switch (classItem.level.short_name) {
      case 'PREP':
        return `Prep ${classItem.grade}`;
      case 'PRI':
        return `Primary ${classItem.grade}`;
      case 'SEC':
        const gradeMap = { '1': '10', '2': '11', '3': '12' };
        return `Grade ${gradeMap[classItem.grade as keyof typeof gradeMap]}`;
      default:
        return `Grade ${classItem.grade}`;
    }
  };

  const getLevelDisplayName = (classItem: any) => {
    if (!classItem.level) return 'Unknown Level';
    
    switch (classItem.level.short_name) {
      case 'PREP':
        return 'Preparatory';
      case 'PRI':
        return 'Primary';
      case 'SEC':
        return 'Secondary';
      default:
        return classItem.level.name;
    }
  };

  const getLevelColor = (levelShortName: string) => {
    switch (levelShortName) {
      case 'PREP':
        return { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-200' };
      case 'PRI':
        return { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-200' };
      case 'SEC':
        return { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-200' };
      default:
        return { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-200' };
    }
  };

  if (loading) {
    return (
      <View className={cn('flex-1 justify-center items-center', Theme.background)}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={cn('text-lg mt-4', Theme.text.secondary)}>Loading classes...</Text>
      </View>
    );
  }

  return (
    <View className={cn('flex-1', Theme.background)}>
      {/* Header */}
      <View className={cn('px-6 pt-16 pb-6', Theme.background)}>
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text className={cn('text-4xl font-bold tracking-tight mb-2', Theme.text.primary)}>
              Classes
            </Text>
            <Text className={cn('text-lg opacity-70', Theme.text.secondary)}>
              Manage and organize school classes
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="bg-blue-500 px-6 py-4 rounded-2xl flex-row items-center space-x-3 shadow-lg shadow-blue-500/25"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="text-white font-semibold text-base">New Class</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View className="flex-row space-x-4">
          <View className={cn('flex-1 p-5 rounded-2xl border', Theme.elevated, Theme.border)}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className={cn('text-2xl font-bold mb-1', Theme.text.primary)}>
                  {classes.length}
                </Text>
                <Text className={cn('text-sm font-medium', Theme.text.secondary)}>
                  Total Classes
                </Text>
              </View>
              <View className="w-12 h-12 bg-blue-500/10 rounded-2xl items-center justify-center">
                <Ionicons name="school" size={24} color="#3b82f6" />
              </View>
            </View>
          </View>

          <View className={cn('flex-1 p-5 rounded-2xl border', Theme.elevated, Theme.border)}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className={cn('text-2xl font-bold mb-1', Theme.text.primary)}>
                  {levels.length}
                </Text>
                <Text className={cn('text-sm font-medium', Theme.text.secondary)}>
                  Education Levels
                </Text>
              </View>
              <View className="w-12 h-12 bg-purple-500/10 rounded-2xl items-center justify-center">
                <Ionicons name="layers" size={24} color="#8b5cf6" />
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 pb-6">
          {/* Classes Grid */}
          <View className="mb-6">
            <Text className={cn('text-2xl font-bold mb-4', Theme.text.primary)}>
              All Classes
            </Text>
            
            {classes.length === 0 ? (
              <View className={cn('items-center py-16 rounded-2xl border-2 border-dashed', Theme.border)}>
                <Ionicons name="school-outline" size={80} className="opacity-20 mb-4" />
                <Text className={cn('text-2xl font-bold mb-2', Theme.text.primary)}>
                  No Classes Yet
                </Text>
                <Text className={cn('text-center opacity-70 mb-6 text-lg', Theme.text.secondary)}>
                  Create your first class to get started
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  className="bg-blue-500 px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/25"
                >
                  <Text className="text-white font-semibold text-lg">Create First Class</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="grid grid-cols-1 gap-4">
                {classes.map(classItem => {
                  const levelColor = getLevelColor(classItem.level?.short_name);
                  return (
                    <TouchableOpacity
                      key={classItem.id}
                      className={cn(
                        'p-6 rounded-3xl border-2 transition-all active:scale-95',
                        Theme.elevated,
                        levelColor.border
                      )}
                      onPress={() => loadClassDetails(classItem)}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-row items-start space-x-5 flex-1">
                          <View className={cn('w-16 h-16 rounded-2xl items-center justify-center', levelColor.bg)}>
                            <Ionicons name="school" size={28} color={levelColor.text.replace('text-', '#').split('-')[0]} />
                          </View>
                          <View className="flex-1">
                            <Text className={cn('text-2xl font-bold mb-3', Theme.text.primary)}>
                              {classItem.name}
                            </Text>
                            <View className="flex-row flex-wrap gap-3">
                              <View className={cn('px-4 py-2 rounded-full', levelColor.bg)}>
                                <Text className={cn('text-base font-semibold', levelColor.text)}>
                                  {getDisplayGrade(classItem)}
                                </Text>
                              </View>
                              <View className="px-4 py-2 rounded-full bg-green-500/10">
                                <Text className="text-green-600 text-base font-semibold">
                                  Section {classItem.section}
                                </Text>
                              </View>
                              <View className="px-4 py-2 rounded-full bg-gray-500/10">
                                <Text className="text-gray-600 text-base font-semibold">
                                  {getLevelDisplayName(classItem)}
                                </Text>
                              </View>
                            </View>
                            {classItem.metadata?.description && (
                              <Text className={cn('text-base mt-3 leading-6', Theme.text.secondary)}>
                                {classItem.metadata.description}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} className="text-gray-400 mt-2" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Create Class Modal */}
      <Modal 
        visible={showCreateModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className={cn('flex-1', Theme.background)}>
          {/* Modal Header */}
          <View className={cn('px-6 pt-8 pb-6 border-b', Theme.background, Theme.border)}>
            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className={cn('text-3xl font-bold', Theme.text.primary)}>
                  New Class
                </Text>
                <Text className={cn('text-lg mt-2', Theme.text.secondary)}>
                  Create a new class for students
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowCreateModal(false)}
                className="w-12 h-12 rounded-2xl items-center justify-center bg-gray-100 dark:bg-gray-800"
              >
                <Ionicons name="close" size={24} className="text-gray-600 dark:text-gray-400" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-6 space-y-8">
              {/* Level Selection */}
              <View>
                <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>
                  Education Level *
                </Text>
                <View className={cn('rounded-2xl border-2 overflow-hidden', Theme.border)}>
                  <Picker
                    selectedValue={formData.level_id}
                    onValueChange={(value) => setFormData({ ...formData, level_id: value, grade: '', section: '', name: '' })}
                  >
                    <Picker.Item 
                      label="Select an education level" 
                      value="" 
                    />
                    {levels.map(level => (
                      <Picker.Item 
                        key={level.id} 
                        label={`${level.name} (${level.short_name})`} 
                        value={level.id} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Grade Selection */}
              {formData.level_id && (
                <View>
                  <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>
                    Grade Level *
                  </Text>
                  <View className={cn('rounded-2xl border-2 overflow-hidden', Theme.border)}>
                    <Picker
                      selectedValue={formData.grade}
                      onValueChange={(value) => setFormData({ ...formData, grade: value, section: '', name: '' })}
                    >
                      <Picker.Item 
                        label={`Select ${levels.find(l => l.id === formData.level_id)?.short_name?.toLowerCase()} grade`} 
                        value="" 
                      />
                      {getGradeOptions(formData.level_id).map(grade => (
                        <Picker.Item 
                          key={grade.value} 
                          label={grade.label} 
                          value={grade.value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}

              {/* Section Selection */}
              {formData.grade && (
                <View>
                  <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>
                    Section *
                  </Text>
                  <View className={cn('rounded-2xl border-2 overflow-hidden', Theme.border)}>
                    <Picker
                      selectedValue={formData.section}
                      onValueChange={(value) => setFormData({ ...formData, section: value })}
                    >
                      <Picker.Item 
                        label="Select section" 
                        value="" 
                      />
                      {getSectionOptions().map(section => (
                        <Picker.Item 
                          key={section.value} 
                          label={section.label} 
                          value={section.value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}

              {/* Auto-generated Class Name */}
              {formData.name && (
                <View className={cn('p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800')}>
                  <Text className={cn('text-base font-medium mb-2 text-blue-800 dark:text-blue-200')}>
                    Class Name
                  </Text>
                  <Text className={cn('text-2xl font-bold text-blue-900 dark:text-blue-100')}>
                    {formData.name}
                  </Text>
                </View>
              )}

              {/* Description */}
              <View>
                <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>
                  Description (Optional)
                </Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Add any additional notes about this class..."
                  multiline
                  numberOfLines={4}
                  className={cn(
                    'w-full px-5 py-4 rounded-2xl border-2 text-lg leading-6',
                    Theme.border,
                    Theme.background,
                    Theme.text.primary
                  )}
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                />
              </View>

              {/* Create Button */}
              <TouchableOpacity
                onPress={handleCreateClass}
                disabled={!formData.name || !formData.level_id || !formData.grade || !formData.section || creating}
                className={cn(
                  'w-full py-5 rounded-2xl items-center shadow-lg',
                  (!formData.name || !formData.level_id || !formData.grade || !formData.section || creating) 
                    ? 'bg-blue-400 shadow-blue-400/25' 
                    : 'bg-blue-500 shadow-blue-500/25 active:scale-95'
                )}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-xl">
                    Create Class
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Class Details Modal */}
      <Modal
        visible={showClassDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClassDetails(false)}
      >
        <View className={cn('flex-1', Theme.background)}>
          {/* Modal Header */}
          <View className={cn('px-6 pt-8 pb-6 border-b', Theme.background, Theme.border)}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className={cn('text-3xl font-bold', Theme.text.primary)}>
                  {selectedClass?.name}
                </Text>
                <Text className={cn('text-lg mt-2', Theme.text.secondary)}>
                  {selectedClass?.level?.name} • Section {selectedClass?.section}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowClassDetails(false)}
                className="w-12 h-12 rounded-2xl items-center justify-center bg-gray-100 dark:bg-gray-800 ml-4"
              >
                <Ionicons name="close" size={24} className="text-gray-600 dark:text-gray-400" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-6 space-y-8">
              {detailsLoading ? (
                <View className="items-center py-16">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className={cn('text-xl mt-6', Theme.text.secondary)}>Loading class details...</Text>
                </View>
              ) : (
                <>
                  {/* Teachers Section */}
                  <View>
                    <View className="flex-row items-center justify-between mb-6">
                      <Text className={cn('text-2xl font-bold', Theme.text.primary)}>
                        Teachers
                      </Text>
                      <View className="px-4 py-2 bg-blue-500/10 rounded-full">
                        <Text className="text-blue-600 font-semibold text-base">
                          {classTeachers.length} teacher{classTeachers.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>

                    {classTeachers.length > 0 ? (
                      <View className="space-y-4">
                        {classTeachers.map((item, index) => (
                          <View
                            key={item.assignmentId}
                            className={cn('p-5 rounded-2xl border-2', Theme.elevated, Theme.border)}
                          >
                            <View className="flex-row items-center space-x-4">
                              <View className="w-12 h-12 bg-green-500/10 rounded-2xl items-center justify-center">
                                <Ionicons name="person" size={24} color="#10b981" />
                              </View>
                              <View className="flex-1">
                                <Text className={cn('text-xl font-semibold mb-1', Theme.text.primary)}>
                                  {item.teacher?.profile?.name || 'Teacher'}
                                </Text>
                                <Text className={cn('text-lg', Theme.text.secondary)}>
                                  {item.subject?.name || 'Subject'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View className={cn('p-8 rounded-2xl border-2 border-dashed items-center', Theme.border)}>
                        <Ionicons name="person-outline" size={64} className="opacity-20 mb-4" />
                        <Text className={cn('text-2xl font-bold mb-2', Theme.text.primary)}>
                          No Teachers
                        </Text>
                        <Text className={cn('text-center opacity-70 text-lg', Theme.text.secondary)}>
                          Assign teachers to this class from the teacher assignments page
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Students Section */}
                  <View>
                    <View className="flex-row items-center justify-between mb-6">
                      <Text className={cn('text-2xl font-bold', Theme.text.primary)}>
                        Students
                      </Text>
                      <View className="px-4 py-2 bg-purple-500/10 rounded-full">
                        <Text className="text-purple-600 font-semibold text-base">
                          {classStudents.length} student{classStudents.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>

                    {classStudents.length > 0 ? (
                      <View className="space-y-4">
                        {classStudents.map((student, index) => (
                          <View
                            key={student.id}
                            className={cn('p-5 rounded-2xl border-2', Theme.elevated, Theme.border)}
                          >
                            <View className="flex-row items-center space-x-4">
                              <View className="w-12 h-12 bg-purple-500/10 rounded-2xl items-center justify-center">
                                <Ionicons name="school" size={24} color="#8b5cf6" />
                              </View>
                              <View className="flex-1">
                                <Text className={cn('text-xl font-semibold mb-1', Theme.text.primary)}>
                                  {student.full_name || student.user?.profile?.name || 'Student'}
                                </Text>
                                <Text className={cn('text-lg', Theme.text.secondary)}>
                                  {student.user?.email || 'No email'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View className={cn('p-8 rounded-2xl border-2 border-dashed items-center', Theme.border)}>
                        <Ionicons name="school-outline" size={64} className="opacity-20 mb-4" />
                        <Text className={cn('text-2xl font-bold mb-2', Theme.text.primary)}>
                          No Students
                        </Text>
                        <Text className={cn('text-center opacity-70 text-lg', Theme.text.secondary)}>
                          Students will appear here when they are assigned to this class
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}