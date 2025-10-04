// app/(teacher)/create-homework.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function CreateHomeworkScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    class: user?.profile.class || '',
    dueDate: '',
    points: 10,
    attachments: false
  });

  const handleCreateHomework = async () => {
    if (!form.title || !form.subject || !form.class || !form.dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement homework creation API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      Alert.alert('Success', 'Homework assigned successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign homework');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        <Text className="text-3xl font-bold text-slate-900 mb-6">Assign Homework</Text>

        <View className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          {/* Basic Info */}
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-slate-900">Assignment Details</Text>
            
            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">Title *</Text>
              <TextInput
                className="border border-slate-300 rounded-lg p-4 bg-white text-slate-900"
                placeholder="Enter homework title"
                placeholderTextColor="#94a3b8"
                value={form.title}
                onChangeText={(text) => setForm({...form, title: text})}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">Description</Text>
              <TextInput
                className="border border-slate-300 rounded-lg p-4 bg-white text-slate-900 h-24"
                placeholder="Enter homework description and instructions..."
                placeholderTextColor="#94a3b8"
                value={form.description}
                onChangeText={(text) => setForm({...form, description: text})}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">Subject *</Text>
              <TextInput
                className="border border-slate-300 rounded-lg p-4 bg-white text-slate-900"
                placeholder="e.g., Mathematics, Science"
                placeholderTextColor="#94a3b8"
                value={form.subject}
                onChangeText={(text) => setForm({...form, subject: text})}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">Class *</Text>
              <TextInput
                className="border border-slate-300 rounded-lg p-4 bg-white text-slate-900"
                placeholder="e.g., 10A, 11B"
                placeholderTextColor="#94a3b8"
                value={form.class}
                onChangeText={(text) => setForm({...form, class: text})}
              />
            </View>
          </View>

          {/* Due Date & Points */}
          <View className="border-t border-slate-200 pt-6">
            <Text className="text-lg font-semibold text-slate-900 mb-4">Settings</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-slate-700 mb-2">Due Date *</Text>
                <TextInput
                  className="border border-slate-300 rounded-lg p-4 bg-white text-slate-900"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  value={form.dueDate}
                  onChangeText={(text) => setForm({...form, dueDate: text})}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-slate-700 mb-2">Points</Text>
                <TextInput
                  className="border border-slate-300 rounded-lg p-4 bg-white text-slate-900"
                  placeholder="10"
                  keyboardType="numeric"
                  value={form.points.toString()}
                  onChangeText={(text) => setForm({...form, points: parseInt(text) || 10})}
                />
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-slate-700">Allow Attachments</Text>
                <Switch
                  value={form.attachments}
                  onValueChange={(value) => setForm({...form, attachments: value})}
                />
              </View>
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            className="bg-slate-900 rounded-lg p-4 flex-row justify-center items-center mt-6"
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
  );
}