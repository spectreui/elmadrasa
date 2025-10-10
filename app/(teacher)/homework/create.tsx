// app/(teacher)/homework/create.tsx - Fixed Date Picker Version
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Switch, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../../src/utils/themeUtils';

interface ClassItem {
  id: string;
  class_id: string;
  class_name: string;
  level: any;
  subjects: SubjectItem[];
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  join_code?: string;
}

export default function CreateHomeworkScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [teacherClasses, setTeacherClasses] = useState<ClassItem[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<SubjectItem[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    subject_name: '',
    class_id: '',
    class_name: '',
    due_date: '',
    points: 10,
    attachments: false
  });

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      setFetchingData(true);
      
      // Use existing methods to get teacher's classes and join codes
      const [classesResponse, joinCodesResponse] = await Promise.all([
        apiService.getTeacherClasses(),
        apiService.getTeacherJoinCodes()
      ]);

      if (classesResponse.data.success) {
        const classes = classesResponse.data.data || [];
        setTeacherClasses(classes);

        // Extract unique subjects from all classes
        const allSubjects: SubjectItem[] = [];
        const subjectMap = new Map();

        classes.forEach((classItem: ClassItem) => {
          if (classItem.subjects) {
            classItem.subjects.forEach((subject: SubjectItem) => {
              if (!subjectMap.has(subject.id)) {
                subjectMap.set(subject.id, true);
                allSubjects.push(subject);
              }
            });
          }
        });

        setTeacherSubjects(allSubjects);
        
        // Auto-select first class and subject if available
        if (classes.length > 0) {
          const firstClass = classes[0];
          setForm(prev => ({
            ...prev,
            class_id: firstClass.class_id,
            class_name: firstClass.class_name
          }));

          if (firstClass.subjects && firstClass.subjects.length > 0) {
            const firstSubject = firstClass.subjects[0];
            setForm(prev => ({
              ...prev,
              subject_id: firstSubject.id,
              subject_name: firstSubject.name
            }));
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to load teacher data:', error);
      Alert.alert('Error', 'Failed to load your classes and subjects');
    } finally {
      setFetchingData(false);
    }
  };

  const handleCreateHomework = async () => {
    if (!form.title || !form.subject_id || !form.class_id || !form.due_date) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Validate due date
    const dueDate = new Date(form.due_date);
    if (isNaN(dueDate.getTime())) {
      Alert.alert('Invalid Date', 'Please enter a valid due date');
      return;
    }

    // Check if due date is in the future
    if (dueDate <= new Date()) {
      Alert.alert('Invalid Date', 'Due date must be in the future');
      return;
    }

    setLoading(true);
    try {
      const homeworkData = {
        title: form.title,
        description: form.description,
        subject: form.subject_name,
        class: form.class_name,
        due_date: form.due_date,
        points: form.points,
        attachments: form.attachments,
        teacher_id: user?.id
      };

      console.log('Creating homework with data:', homeworkData);
      const response = await apiService.createHomework(homeworkData);
      
      if (response.data.success) {
        Alert.alert('Success', 'Homework assigned successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Homework creation error:', error);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to assign homework');
    } finally {
      setLoading(false);
    }
  };

  // Simple date picker using Modal
  const DatePickerModal = () => {
    const [tempDate, setTempDate] = useState(selectedDate);

    const handleConfirm = () => {
      setSelectedDate(tempDate);
      const formattedDate = tempDate.toISOString().split('T')[0];
      setForm({ ...form, due_date: formattedDate });
      setShowDatePicker(false);
    };

    const handleCancel = () => {
      setShowDatePicker(false);
    };

    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

    return (
      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <View className={cn('flex-1', Theme.background)}>
          <View className={cn('px-6 pt-8 pb-6 border-b', Theme.background, Theme.border)}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={cn('text-2xl font-bold', Theme.text.primary)}>
                Select Due Date
              </Text>
              <TouchableOpacity 
                onPress={handleCancel}
                className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800"
              >
                <Ionicons name="close" size={20} className={Theme.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1">
            <View className="p-6 space-y-6">
              {/* Year Selection */}
              <View>
                <Text className={cn('text-lg font-semibold mb-3', Theme.text.primary)}>Year</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row space-x-2">
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        className={cn(
                          'px-4 py-3 rounded-2xl border',
                          tempDate.getFullYear() === year ? 'bg-blue-500 border-blue-500' : Theme.border
                        )}
                        onPress={() => setTempDate(new Date(year, tempDate.getMonth(), tempDate.getDate()))}
                      >
                        <Text className={tempDate.getFullYear() === year ? 'text-white font-semibold' : cn('font-medium', Theme.text.primary)}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Month Selection */}
              <View>
                <Text className={cn('text-lg font-semibold mb-3', Theme.text.primary)}>Month</Text>
                <View className="grid grid-cols-3 gap-3">
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      className={cn(
                        'p-4 rounded-2xl border items-center',
                        tempDate.getMonth() === index ? 'bg-blue-500 border-blue-500' : Theme.border
                      )}
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), index, tempDate.getDate()))}
                    >
                      <Text className={tempDate.getMonth() === index ? 'text-white font-semibold' : cn('font-medium', Theme.text.primary)}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Day Selection */}
              <View>
                <Text className={cn('text-lg font-semibold mb-3', Theme.text.primary)}>Day</Text>
                <View className="grid grid-cols-7 gap-2">
                  {Array.from({ length: getDaysInMonth(tempDate.getFullYear(), tempDate.getMonth()) }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      className={cn(
                        'w-10 h-10 rounded-full items-center justify-center border',
                        tempDate.getDate() === day ? 'bg-blue-500 border-blue-500' : Theme.border
                      )}
                      onPress={() => setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth(), day))}
                    >
                      <Text className={tempDate.getDate() === day ? 'text-white font-semibold' : cn('font-medium', Theme.text.primary)}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Selected Date Preview */}
              <View className={cn('p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800')}>
                <Text className={cn('text-sm font-medium mb-1 text-blue-800 dark:text-blue-200')}>
                  Selected Due Date
                </Text>
                <Text className={cn('text-xl font-bold text-blue-900 dark:text-blue-100')}>
                  {formatDisplayDate(tempDate.toISOString().split('T')[0])}
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3 pt-4">
                <TouchableOpacity
                  onPress={handleCancel}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center"
                >
                  <Text className={cn('font-semibold text-lg', Theme.text.primary)}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  className="flex-1 px-6 py-4 rounded-2xl bg-blue-500 items-center"
                >
                  <Text className="text-white font-semibold text-lg">Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Select due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get available subjects for selected class
  const getAvailableSubjects = () => {
    if (!form.class_id) return teacherSubjects;
    
    const selectedClass = teacherClasses.find(c => c.class_id === form.class_id);
    return selectedClass?.subjects || teacherSubjects;
  };

  if (fetchingData) {
    return (
      <View className={cn('flex-1 justify-center items-center', Theme.background)}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={cn('text-lg mt-4', Theme.text.secondary)}>Loading your classes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={cn('flex-1', Theme.background)}
    >
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View className={cn('px-6 pt-16 pb-6 border-b', Theme.background, Theme.border)}>
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className={cn('text-3xl font-bold mb-2', Theme.text.primary)}>
                New Homework
              </Text>
              <Text className={cn('text-lg opacity-70', Theme.text.secondary)}>
                Create assignment for your class
              </Text>
            </View>
            <TouchableOpacity 
              className={cn('w-12 h-12 rounded-2xl items-center justify-center', Theme.elevated)}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} className={Theme.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 p-6">
          <View className={cn('rounded-2xl p-6 border', Theme.elevated, Theme.border)}>
            {/* Basic Info */}
            <View className="space-y-6">
              <View>
                <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>
                  Assignment Details
                </Text>
                
                <View className="space-y-5">
                  {/* Title */}
                  <View>
                    <Text className={cn('text-base font-semibold mb-3', Theme.text.primary)}>
                      Title *
                    </Text>
                    <TextInput
                      className={cn(
                        'rounded-2xl p-4 border text-lg',
                        Theme.border,
                        Theme.background,
                        Theme.text.primary
                      )}
                      placeholder="Enter homework title"
                      placeholderTextColor="#9CA3AF"
                      value={form.title}
                      onChangeText={(text) => setForm({...form, title: text})}
                    />
                  </View>

                  {/* Description */}
                  <View>
                    <Text className={cn('text-base font-semibold mb-3', Theme.text.primary)}>
                      Description
                    </Text>
                    <TextInput
                      className={cn(
                        'rounded-2xl p-4 border text-lg h-32',
                        Theme.border,
                        Theme.background,
                        Theme.text.primary
                      )}
                      placeholder="Enter homework description and instructions..."
                      placeholderTextColor="#9CA3AF"
                      value={form.description}
                      onChangeText={(text) => setForm({...form, description: text})}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Class Selection */}
                  <View>
                    <Text className={cn('text-base font-semibold mb-3', Theme.text.primary)}>
                      Class *
                    </Text>
                    <TouchableOpacity
                      className={cn(
                        'rounded-2xl p-4 border flex-row items-center justify-between',
                        Theme.border,
                        Theme.background
                      )}
                      onPress={() => setShowClassModal(true)}
                    >
                      <Text className={cn('text-lg', form.class_name ? Theme.text.primary : 'text-gray-500')}>
                        {form.class_name || 'Select class'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} className={Theme.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Subject Selection */}
                  <View>
                    <Text className={cn('text-base font-semibold mb-3', Theme.text.primary)}>
                      Subject *
                    </Text>
                    <TouchableOpacity
                      className={cn(
                        'rounded-2xl p-4 border flex-row items-center justify-between',
                        Theme.border,
                        Theme.background
                      )}
                      onPress={() => setShowSubjectModal(true)}
                      disabled={!form.class_id}
                    >
                      <Text className={cn('text-lg', form.subject_name ? Theme.text.primary : 'text-gray-500')}>
                        {form.subject_name || (form.class_id ? 'Select subject' : 'Select class first')}
                      </Text>
                      <Ionicons name="chevron-down" size={20} className={Theme.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Settings */}
              <View className={cn('border-t pt-6', Theme.border)}>
                <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>
                  Settings
                </Text>
                
                <View className="space-y-5">
                  {/* Due Date */}
                  <View>
                    <Text className={cn('text-base font-semibold mb-3', Theme.text.primary)}>
                      Due Date *
                    </Text>
                    <TouchableOpacity
                      className={cn(
                        'rounded-2xl p-4 border flex-row items-center justify-between',
                        Theme.border,
                        Theme.background
                      )}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text className={cn('text-lg', form.due_date ? Theme.text.primary : 'text-gray-500')}>
                        {formatDisplayDate(form.due_date)}
                      </Text>
                      <Ionicons name="calendar" size={20} className={Theme.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Points */}
                  <View>
                    <Text className={cn('text-base font-semibold mb-3', Theme.text.primary)}>
                      Points
                    </Text>
                    <TextInput
                      className={cn(
                        'rounded-2xl p-4 border text-lg',
                        Theme.border,
                        Theme.background,
                        Theme.text.primary
                      )}
                      placeholder="10"
                      keyboardType="numeric"
                      value={form.points.toString()}
                      onChangeText={(text) => setForm({...form, points: parseInt(text) || 10})}
                    />
                  </View>

                  {/* Attachments */}
                  <View className="flex-row justify-between items-center py-2">
                    <View className="flex-1">
                      <Text className={cn('font-semibold text-lg', Theme.text.primary)}>
                        Allow Attachments
                      </Text>
                      <Text className={cn('text-sm mt-1', Theme.text.secondary)}>
                        Students can upload files with their submission
                      </Text>
                    </View>
                    <Switch
                      value={form.attachments}
                      onValueChange={(value) => setForm({...form, attachments: value})}
                      trackColor={{ false: '#f0f0f0', true: '#3b82f6' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              className={cn(
                'w-full py-5 rounded-2xl items-center mt-8 flex-row justify-center',
                loading || !form.title || !form.subject_id || !form.class_id || !form.due_date
                  ? 'bg-blue-400' 
                  : 'bg-blue-500'
              )}
              onPress={handleCreateHomework}
              disabled={loading || !form.title || !form.subject_id || !form.class_id || !form.due_date}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="book" size={22} color="white" />
                  <Text className="text-white font-semibold text-xl ml-3">
                    Assign Homework
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Class Selection Modal */}
      <Modal
        visible={showClassModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClassModal(false)}
      >
        <View className={cn('flex-1', Theme.background)}>
          <View className={cn('px-6 pt-8 pb-6 border-b', Theme.background, Theme.border)}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={cn('text-2xl font-bold', Theme.text.primary)}>
                Select Class
              </Text>
              <TouchableOpacity 
                onPress={() => setShowClassModal(false)}
                className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800"
              >
                <Ionicons name="close" size={20} className={Theme.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1">
            <View className="p-6 space-y-3">
              {teacherClasses.map((classItem) => (
                <TouchableOpacity
                  key={classItem.class_id}
                  className={cn(
                    'p-4 rounded-2xl border flex-row items-center justify-between',
                    form.class_id === classItem.class_id ? 'bg-blue-50 border-blue-200' : Theme.elevated,
                    Theme.border
                  )}
                  onPress={() => {
                    setForm({
                      ...form,
                      class_id: classItem.class_id,
                      class_name: classItem.class_name,
                      subject_id: '', // Reset subject when class changes
                      subject_name: ''
                    });
                    setShowClassModal(false);
                  }}
                >
                  <View className="flex-1">
                    <Text className={cn('text-lg font-semibold', Theme.text.primary)}>
                      {classItem.class_name}
                    </Text>
                    <Text className={cn('text-sm', Theme.text.secondary)}>
                      {classItem.level?.name} • {classItem.subjects?.length || 0} subject{classItem.subjects?.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {form.class_id === classItem.class_id && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View className={cn('flex-1', Theme.background)}>
          <View className={cn('px-6 pt-8 pb-6 border-b', Theme.background, Theme.border)}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={cn('text-2xl font-bold', Theme.text.primary)}>
                Select Subject
              </Text>
              <TouchableOpacity 
                onPress={() => setShowSubjectModal(false)}
                className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800"
              >
                <Ionicons name="close" size={20} className={Theme.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1">
            <View className="p-6 space-y-3">
              {getAvailableSubjects().map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  className={cn(
                    'p-4 rounded-2xl border flex-row items-center justify-between',
                    form.subject_id === subject.id ? 'bg-blue-50 border-blue-200' : Theme.elevated,
                    Theme.border
                  )}
                  onPress={() => {
                    setForm({
                      ...form,
                      subject_id: subject.id,
                      subject_name: subject.name
                    });
                    setShowSubjectModal(false);
                  }}
                >
                  <View className="flex-1">
                    <Text className={cn('text-lg font-semibold', Theme.text.primary)}>
                      {subject.name}
                    </Text>
                    <Text className={cn('text-sm', Theme.text.secondary)}>
                      Code: {subject.code}
                    </Text>
                  </View>
                  {form.subject_id === subject.id && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      <DatePickerModal />
    </KeyboardAvoidingView>
  );
}