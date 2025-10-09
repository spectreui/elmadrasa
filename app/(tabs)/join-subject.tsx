// app/(student)/join-subject.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';

export default function JoinSubjectScreen() {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinSubject = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.joinSubjectWithCode(joinCode.trim());
      
      if (response.data.success) {
        Alert.alert('Success', 'Successfully joined the subject!');
        setJoinCode('');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to join subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={cn('flex-1', Theme.background)}>
      {/* Header */}
      <View className={cn('p-6 border-b', Theme.background, Theme.border)}>
        <Text className={cn('text-2xl font-bold mb-2', Theme.text.primary)}>
          Join Subject
        </Text>
        <Text className={cn('text-base', Theme.text.secondary)}>
          Enter the join code from your teacher
        </Text>
      </View>

      <View className="p-6 space-y-6">
        {/* Instructions */}
        <View className={cn('p-4 rounded-xl border', Theme.elevated, Theme.border)}>
          <Text className={cn('font-semibold mb-2', Theme.text.primary)}>
            How to join a subject:
          </Text>
          <Text className={cn('text-sm', Theme.text.secondary)}>
            1. Get the join code from your teacher{'\n'}
            2. Enter it below{'\n'}
            3. You'll be automatically enrolled in that subject
          </Text>
        </View>

        {/* Join Code Input */}
        <View>
          <Text className={cn('text-sm font-semibold mb-2', Theme.text.primary)}>
            Join Code
          </Text>
          <TextInput
            className={cn(
              'border rounded-xl p-4 text-base font-mono',
              Theme.background,
              Theme.border,
              Theme.text.primary
            )}
            placeholder="SEC-2B-PHY-7KQWZ"
            placeholderTextColor="#6b7280"
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {/* Join Button */}
        <TouchableOpacity
          className="bg-system-blue rounded-xl p-4 flex-row justify-center items-center shadow-sm active:opacity-80"
          onPress={handleJoinSubject}
          disabled={loading || !joinCode.trim()}
        >
          <Ionicons name="enter" size={20} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">
            {loading ? 'Joining...' : 'Join Subject'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}