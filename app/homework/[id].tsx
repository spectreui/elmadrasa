import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeworkDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [submission, setSubmission] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mock homework data
  const homework = {
    id: '1',
    title: 'Algebra Practice Problems',
    description: 'Complete exercises 1-20 from chapter 3. Show all your work and submit your solutions.',
    subject: 'Mathematics',
    class: '10A',
    due_date: '2024-12-25',
    points: 20,
    attachments: true,
    teacher: {
      profile: { name: 'Dr. Smith' }
    },
    instructions: `
1. Solve all equations showing step-by-step work
2. Include units where applicable
3. Submit before the due date
4. You can attach images of your work if needed
    `
  };

  const handleSubmit = async () => {
    if (!submission.trim()) {
      Alert.alert('Error', 'Please provide your submission');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Success', 'Homework submitted successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit homework');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        {/* Header */}
        <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {homework.title}
          </Text>
          <View className="flex-row items-center mb-3">
            <Ionicons name="person" size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm ml-2">
              {homework.teacher.profile.name}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="book" size={16} color="#6b7280" />
              <Text className="text-gray-600 text-sm ml-2">
                {homework.subject} • {homework.class}
              </Text>
            </View>
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-blue-700 text-sm font-medium">
                {homework.points} points
              </Text>
            </View>
          </View>
        </View>

        {/* Due Date */}
        <View className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 mb-6">
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={20} color="#d97706" />
            <Text className="text-yellow-800 font-medium ml-2">
              Due: {formatDueDate(homework.due_date)}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Description
          </Text>
          <Text className="text-gray-600 leading-6">
            {homework.description}
          </Text>
        </View>

        {/* Instructions */}
        <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Instructions
          </Text>
          <Text className="text-gray-600 leading-6 whitespace-pre-line">
            {homework.instructions}
          </Text>
        </View>

        {/* Submission */}
        <View className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Your Submission
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl p-4 bg-white text-gray-900 h-32 text-base leading-5"
            placeholder="Type your answer here...\n\nYou can include:\n• Text answers\n• Code snippets\n• Math equations\n• Explanations"
            placeholderTextColor="#9ca3af"
            value={submission}
            onChangeText={setSubmission}
            multiline
            textAlignVertical="top"
          />
          
          {homework.attachments && (
            <TouchableOpacity className="border border-gray-300 rounded-xl p-4 flex-row items-center mt-3">
              <Ionicons name="attach" size={20} color="#6b7280" />
              <Text className="text-gray-600 ml-2 font-medium">
                Add Attachments
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-blue-600 rounded-xl p-4 flex-row justify-center items-center mt-6"
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Submit Homework
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}