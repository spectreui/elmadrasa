import React, { useState } from 'react';
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
  Platform 
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function CreateHomeworkScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    class: user?.profile.class || '',
    due_date: '',
    points: 10,
    attachments: false
  });

  const handleCreateHomework = async () => {
    if (!form.title || !form.subject || !form.class || !form.due_date) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Validate due date
    const dueDate = new Date(form.due_date);
    if (isNaN(dueDate.getTime())) {
      Alert.alert('Invalid Date', 'Please enter a valid due date in YYYY-MM-DD format');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createHomework(form);
      if (response.data.success) {
        Alert.alert('Success', 'Homework assigned successfully!');
        router.back();
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Homework creation error:', error);
      Alert.alert('Error', error.message || 'Failed to assign homework');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View className="bg-white px-6 pt-16 pb-6 border-b border-gray-100">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">New Assignment</Text>
              <Text className="text-gray-500 text-base font-medium">Create homework for your class</Text>
            </View>
            <TouchableOpacity 
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 p-6">
          <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            {/* Basic Info */}
            <View className="space-y-6">
              <View>
                <Text className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</Text>
                
                <View className="space-y-5">
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Title *</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base"
                      placeholder="Enter homework title"
                      placeholderTextColor="#8E8E93"
                      value={form.title}
                      onChangeText={(text) => setForm({...form, title: text})}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base h-32"
                      placeholder="Enter homework description and instructions..."
                      placeholderTextColor="#8E8E93"
                      value={form.description}
                      onChangeText={(text) => setForm({...form, description: text})}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Subject *</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base"
                      placeholder="e.g., Mathematics, Science"
                      placeholderTextColor="#8E8E93"
                      value={form.subject}
                      onChangeText={(text) => setForm({...form, subject: text})}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Class *</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base"
                      placeholder="e.g., 10A, 11B"
                      placeholderTextColor="#8E8E93"
                      value={form.class}
                      onChangeText={(text) => setForm({...form, class: text})}
                    />
                  </View>
                </View>
              </View>

              {/* Settings */}
              <View className="border-t border-gray-100 pt-6">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Settings</Text>
                
                <View className="space-y-5">
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Due Date *</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#8E8E93"
                      value={form.due_date}
                      onChangeText={(text) => setForm({...form, due_date: text})}
                    />
                    <Text className="text-gray-400 text-xs mt-2">
                      Enter the due date in YYYY-MM-DD format
                    </Text>
                  </View>

                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Points</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base"
                      placeholder="10"
                      keyboardType="numeric"
                      value={form.points.toString()}
                      onChangeText={(text) => setForm({...form, points: parseInt(text) || 10})}
                    />
                  </View>

                  <View className="flex-row justify-between items-center py-2">
                    <View>
                      <Text className="text-gray-700 font-semibold text-base">Allow Attachments</Text>
                      <Text className="text-gray-500 text-sm mt-1">Students can upload files</Text>
                    </View>
                    <Switch
                      value={form.attachments}
                      onValueChange={(value) => setForm({...form, attachments: value})}
                      trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                      thumbColor={form.attachments ? '#ffffff' : '#ffffff'}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              className="bg-blue-500 rounded-xl p-4 flex-row justify-center items-center mt-8 shadow-sm active:opacity-80"
              onPress={handleCreateHomework}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>  
                  <Ionicons name="book" size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">Assign Homework</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}