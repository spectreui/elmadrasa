// app/(teacher)/my-classes.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';
import * as Clipboard from 'expo-clipboard';

export default function MyClassesScreen() {
  const { user } = useAuth();
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [joinCodes, setJoinCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherClasses();
  }, []);

  const loadTeacherClasses = async () => {
    try {
      const [classesRes, codesRes] = await Promise.all([
        apiService.getTeacherClasses(),
        apiService.getTeacherJoinCodes(),
      ]);

      console.log('📚 Teacher Classes:', classesRes.data.data);
      console.log('🔑 Join Codes:', codesRes.data.data);

      setTeacherClasses(classesRes.data.data || []);
      setJoinCodes(codesRes.data.data || []);
    } catch (error) {
      console.error('Failed to load teacher classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJoinCodeForClassSubject = (classId: string, subjectId: string) => {
    const foundCode = joinCodes.find(code => {
      console.log('🔍 Searching for:', { classId, subjectId });
      console.log('🔍 Checking code:', { 
        codeClassId: code.class_id, 
        codeSubjectId: code.subject_id,
        codeValue: code.code || code.join_code 
      });
      return code.class_id === classId && code.subject_id === subjectId;
    });
    
    console.log('✅ Found join code:', foundCode);
    return foundCode;
  };

  const copyJoinCode = async (joinCodeData: any) => {
    try {
      // Debug the join code data structure
      console.log('📋 Join code data to copy:', joinCodeData);
      
      // Try different possible property names
      const codeToCopy = joinCodeData.code || joinCodeData.join_code || joinCodeData;
      
      if (!codeToCopy) {
        Alert.alert('Error', 'No join code found to copy');
        return;
      }

      console.log('📋 Copying code:', codeToCopy);
      
      await Clipboard.setStringAsync(codeToCopy);
      Alert.alert(
        'Join Code Copied!', 
        `Code: ${codeToCopy}\n\nShare this with your students.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy join code to clipboard');
    }
  };

  if (loading) {
    return (
      <View className={cn('flex-1 justify-center items-center', Theme.background)}>
        <Text className={cn('text-lg', Theme.text.secondary)}>Loading your classes...</Text>
      </View>
    );
  }

  return (
    <View className={cn('flex-1', Theme.background)}>
      {/* Header */}
      <View className={cn('p-6 border-b', Theme.background, Theme.border)}>
        <Text className={cn('text-2xl font-bold mb-2', Theme.text.primary)}>
          My Classes
        </Text>
        <Text className={cn('text-base', Theme.text.secondary)}>
          Classes and subjects you teach
        </Text>
        
        {/* Debug Info */}
        <TouchableOpacity 
          onPress={() => {
            console.log('🐛 DEBUG INFO:');
            console.log('Teacher Classes:', teacherClasses);
            console.log('Join Codes:', joinCodes);
            Alert.alert('Debug Info', 'Check console for debug information');
          }}
          className="mt-2 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded self-start"
        >
          <Text className="text-xs text-gray-600 dark:text-gray-300">
            Debug: Show Data
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {teacherClasses.length === 0 ? (
            <View className={cn('items-center py-12', Theme.background)}>
              <Ionicons name="school" size={64} color="#9ca3af" />
              <Text className={cn('text-lg font-semibold mt-4', Theme.text.secondary)}>
                No classes assigned
              </Text>
              <Text className={cn('text-sm text-center mt-2', Theme.text.tertiary)}>
                Contact your administrator to get assigned to classes and subjects.
              </Text>
            </View>
          ) : (
            teacherClasses.map(classItem => (
              <View key={classItem.id} className="mb-8">
                <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>
                  {classItem.class_name}
                </Text>
                
                {/* Subjects for this class */}
                <View className="space-y-3">
                  {classItem.subjects.map((subject: any) => {
                    const joinCode = getJoinCodeForClassSubject(classItem.class_id, subject.id);
                    
                    return (
                      <View
                        key={subject.id}
                        className={cn(
                          'p-4 rounded-xl border',
                          Theme.elevated,
                          Theme.border
                        )}
                      >
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center space-x-3">
                            <View 
                              className="w-10 h-10 rounded-lg items-center justify-center"
                              style={{ backgroundColor: subject.color || '#3b82f6' }}
                            >
                              <Ionicons 
                                name={subject.icon as any || 'book'} 
                                size={20} 
                                color="white" 
                              />
                            </View>
                            <View className="flex-1">
                              <Text className={cn('text-lg font-semibold', Theme.text.primary)}>
                                {subject.name}
                              </Text>
                              <Text className={cn('text-sm', Theme.text.secondary)}>
                                {classItem.class_name}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {joinCode ? (
                          <TouchableOpacity
                            onPress={() => copyJoinCode(joinCode)}
                            className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex-row items-center justify-between active:bg-blue-100 dark:active:bg-blue-900/30"
                          >
                            <View className="flex-1">
                              <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                                Join Code
                              </Text>
                              <Text className="text-blue-800 dark:text-blue-300 font-mono text-base">
                                {joinCode.code || joinCode.join_code || 'No code available'}
                              </Text>
                              <Text className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                                Tap to copy and share with students
                              </Text>
                            </View>
                            <View className="bg-blue-500 p-2 rounded-lg ml-3">
                              <Ionicons name="copy" size={18} color="white" />
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <View className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                            <Text className="text-gray-600 dark:text-gray-400 text-sm text-center">
                              No join code available
                            </Text>
                            <Text className="text-gray-500 dark:text-gray-500 text-xs text-center mt-1">
                              Class ID: {classItem.class_id}, Subject ID: {subject.id}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}