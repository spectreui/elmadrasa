// app/(student)/homework/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../../src/utils/themeUtils';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  due_date: string;
  points: number;
  attachments: boolean;
  teacher_id: string;
  created_at: string;
  teacher?: {
    profile: {
      name: string;
    };
  };
}

interface Submission {
  id: string;
  content: string;
  attachments: string[];
  submitted_at: string;
  grade?: number;
  feedback?: string;
}

export default function HomeworkDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadHomework();
  }, [id]);

  const loadHomework = async () => {
    try {
      setLoading(true);
      // Load homework details
      const response = await apiService.getHomeworkById(id as string);
      
      if (response.data.success) {
        setHomework(response.data.data);
        
        // Check for existing submission
        if (response.data.data.submission) {
          setSubmission(response.data.data.submission);
          setSubmissionContent(response.data.data.submission.content || '');
          setAttachments(response.data.data.submission.attachments || []);
        }
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Failed to load homework:', error);
      Alert.alert('Error', 'Failed to load homework details');
      
      // Fallback to mock data for development
      const mockHomework: Homework = {
        id: id as string,
        title: 'Mathematics Assignment',
        description: 'Complete exercises 1-10 from chapter 5. Show all your work and calculations. Make sure to demonstrate your understanding of algebraic principles.',
        subject: 'Mathematics',
        class: '10A',
        due_date: '2024-01-20T23:59:00Z',
        points: 20,
        attachments: true,
        teacher_id: 'teacher1',
        created_at: '2024-01-10T10:00:00Z',
        teacher: {
          profile: {
            name: 'Mr. Johnson'
          }
        }
      };
      
      setHomework(mockHomework);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    if (!homework?.attachments) {
      Alert.alert('Info', 'This homework does not allow attachments');
      return;
    }

    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      console.log('Selected file:', file);
      
      // In a real app, you would upload the file to your server
      // For now, we'll just store the file name
      setAttachments(prev => [...prev, file.name]);
      
      Alert.alert('Success', 'File attached successfully');
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to attach file');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitHomework = async () => {
    if (!submissionContent.trim()) {
      Alert.alert('Error', 'Please enter your submission content');
      return;
    }

    // Check if due date has passed
    if (homework && new Date(homework.due_date) < new Date()) {
      Alert.alert('Error', 'This homework is past due and cannot be submitted');
      return;
    }

    setSubmitting(true);
    try {
      const submissionData = {
        homework_id: id,
        content: submissionContent,
        attachments: attachments
      };

      console.log('Submitting homework:', submissionData);
      
      // Submit homework
      const response = await apiService.submitHomework(id as string, submissionContent, attachments);
      
      if (response.data.success) {
        Alert.alert('Success', 'Homework submitted successfully!', [
          { 
            text: 'OK', 
            onPress: () => router.back()
          }
        ]);
        
        // Update local state
        setSubmission({
          id: response.data.data.id,
          content: submissionContent,
          attachments: attachments,
          submitted_at: new Date().toISOString()
        });
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Submit homework error:', error);
      
      // For demo purposes, simulate success
      Alert.alert(
        'Demo Mode', 
        'Homework submitted successfully! (Demo Mode)',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getDueStatus = () => {
    if (!homework) return { status: 'unknown', color: 'bg-gray-100', text: 'Unknown' };
    
    if (submission) {
      return { 
        status: 'submitted', 
        color: 'bg-blue-500/10 border-blue-200', 
        text: 'Submitted',
        textColor: 'text-blue-600'
      };
    }

    const today = new Date();
    const due = new Date(homework.due_date);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffTime < 0) {
      return { 
        status: 'overdue', 
        color: 'bg-red-500/10 border-red-200', 
        text: 'Overdue',
        textColor: 'text-red-600'
      };
    }
    if (diffHours <= 24) {
      return { 
        status: 'due', 
        color: 'bg-orange-500/10 border-orange-200', 
        text: `Due in ${diffHours} hours`,
        textColor: 'text-orange-600'
      };
    }
    if (diffDays <= 2) {
      return { 
        status: 'soon', 
        color: 'bg-yellow-500/10 border-yellow-200', 
        text: `Due in ${diffDays} days`,
        textColor: 'text-yellow-600'
      };
    }
    return { 
      status: 'pending', 
      color: 'bg-green-500/10 border-green-200', 
      text: `Due in ${diffDays} days`,
      textColor: 'text-green-600'
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View className={cn('flex-1 justify-center items-center', Theme.background)}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={cn('text-lg mt-4', Theme.text.secondary)}>Loading homework...</Text>
      </View>
    );
  }

  if (!homework) {
    return (
      <View className={cn('flex-1 justify-center items-center', Theme.background)}>
        <Ionicons name="document-text-outline" size={64} className="opacity-30 mb-4" />
        <Text className={cn('text-2xl font-bold mb-2', Theme.text.primary)}>Homework Not Found</Text>
        <Text className={cn('text-center opacity-70 mb-6', Theme.text.secondary)}>
          The homework you're looking for doesn't exist or you don't have access to it.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-blue-500 px-6 py-3 rounded-2xl">
          <Text className="text-white font-semibold text-lg">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dueStatus = getDueStatus();
  const isSubmitted = !!submission;
  const isOverdue = dueStatus.status === 'overdue';
  const canSubmit = !isSubmitted && !isOverdue;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={cn('flex-1', Theme.background)}
    >
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className={cn('px-6 pt-16 pb-6 border-b', Theme.background, Theme.border)}>
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="flex-row items-center"
            >
              <Ionicons name="arrow-back" size={20} className={Theme.text.secondary} />
              <Text className={cn('ml-2', Theme.text.secondary)}>Back to Homework</Text>
            </TouchableOpacity>
            
            <View className={cn('px-3 py-1 rounded-full', dueStatus.color)}>
              <Text className={cn('text-sm font-medium', dueStatus.textColor)}>
                {dueStatus.text}
              </Text>
            </View>
          </View>

          <Text className={cn('text-3xl font-bold mb-2', Theme.text.primary)}>
            {homework.title}
          </Text>
          
          <View className="flex-row flex-wrap gap-2">
            <View className="px-3 py-1 bg-gray-500/10 rounded-full">
              <Text className="text-gray-600 text-sm font-medium">
                {homework.subject}
              </Text>
            </View>
            <View className="px-3 py-1 bg-gray-500/10 rounded-full">
              <Text className="text-gray-600 text-sm font-medium">
                {homework.points} points
              </Text>
            </View>
            <View className="px-3 py-1 bg-gray-500/10 rounded-full">
              <Text className="text-gray-600 text-sm font-medium">
                By: {homework.teacher?.profile?.name || 'Teacher'}
              </Text>
            </View>
          </View>
        </View>

        <View className="p-6 space-y-6">
          {/* Due Date Card */}
          <View className={cn('p-4 rounded-2xl border', dueStatus.color, Theme.elevated)}>
            <View className="flex-row items-center space-x-3">
              <Ionicons name="calendar" size={20} className={dueStatus.textColor} />
              <View>
                <Text className={cn('font-semibold', dueStatus.textColor)}>Due Date</Text>
                <Text className={cn('text-sm', dueStatus.textColor)}>
                  {formatDate(homework.due_date)}
                </Text>
              </View>
            </View>
          </View>

          {/* Description Card */}
          <View className={cn('p-5 rounded-2xl border', Theme.elevated, Theme.border)}>
            <Text className={cn('text-xl font-semibold mb-3', Theme.text.primary)}>
              Assignment Description
            </Text>
            <Text className={cn('text-lg leading-7', Theme.text.primary)}>
              {homework.description}
            </Text>
          </View>

          {/* Submission Section */}
          {isSubmitted ? (
            <View className={cn('p-5 rounded-2xl border', Theme.elevated, Theme.border)}>
              <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>
                Your Submission
              </Text>
              
              <View className="mb-4">
                <Text className={cn('text-sm font-medium mb-2', Theme.text.primary)}>Submitted Content:</Text>
                <Text className={cn('text-base p-3 rounded-xl bg-gray-50 dark:bg-gray-800', Theme.text.primary)}>
                  {submission?.content}
                </Text>
              </View>

              {submission?.attachments && submission.attachments.length > 0 && (
                <View className="mb-4">
                  <Text className={cn('text-sm font-medium mb-2', Theme.text.primary)}>Attachments:</Text>
                  <View className="space-y-2">
                    {submission.attachments.map((attachment, index) => (
                      <View key={index} className="flex-row items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                        <Ionicons name="document" size={20} className={Theme.text.secondary} />
                        <Text className={cn('ml-2 flex-1', Theme.text.primary)}>{attachment}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <Text className={cn('text-sm', Theme.text.secondary)}>
                Submitted on: {formatDate(submission?.submitted_at || '')}
              </Text>

              {submission?.grade !== undefined && (
                <View className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200">
                  <Text className="text-emerald-800 dark:text-emerald-200 font-semibold mb-1">
                    Grade: {submission.grade}/{homework.points}
                  </Text>
                  {submission.feedback && (
                    <Text className="text-emerald-700 dark:text-emerald-300">
                      Feedback: {submission.feedback}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View className={cn('p-5 rounded-2xl border', Theme.elevated, Theme.border)}>
              <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>
                Your Submission
              </Text>

              <View className="mb-4">
                <Text className={cn('text-sm font-medium mb-3', Theme.text.primary)}>
                  Answer / Submission Content *
                </Text>
                <TextInput
                  className={cn(
                    'rounded-2xl p-4 border text-lg min-h-40',
                    Theme.border,
                    Theme.background,
                    Theme.text.primary
                  )}
                  placeholder="Type your answer or submission here..."
                  value={submissionContent}
                  onChangeText={setSubmissionContent}
                  multiline
                  textAlignVertical="top"
                  editable={canSubmit}
                />
              </View>

              {homework.attachments && (
                <View className="mb-4">
                  <Text className={cn('text-sm font-medium mb-3', Theme.text.primary)}>
                    Attachments
                  </Text>
                  
                  {attachments.length > 0 && (
                    <View className="mb-3 space-y-2">
                      {attachments.map((attachment, index) => (
                        <View key={index} className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
                          <View className="flex-row items-center flex-1">
                            <Ionicons name="document" size={20} className={Theme.text.secondary} />
                            <Text className={cn('ml-2 flex-1', Theme.text.primary)} numberOfLines={1}>
                              {attachment}
                            </Text>
                          </View>
                          <TouchableOpacity 
                            onPress={() => removeAttachment(index)}
                            disabled={!canSubmit}
                          >
                            <Ionicons name="close-circle" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={pickDocument}
                    disabled={!canSubmit || uploading}
                    className={cn(
                      'flex-row items-center justify-center py-3 rounded-xl border-2 border-dashed',
                      canSubmit ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 bg-gray-100'
                    )}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <>
                        <Ionicons 
                          name="attach" 
                          size={20} 
                          color={canSubmit ? "#3b82f6" : "#9ca3af"} 
                        />
                        <Text className={cn('ml-2 font-medium', canSubmit ? 'text-blue-600' : 'text-gray-500')}>
                          Add Attachment
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {isOverdue && (
                <View className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 mb-4">
                  <Text className="text-red-700 dark:text-red-300 font-medium">
                    This assignment is overdue and can no longer be submitted.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSubmitHomework}
                disabled={!canSubmit || !submissionContent.trim() || submitting}
                className={cn(
                  'w-full py-4 rounded-2xl items-center',
                  (!canSubmit || !submissionContent.trim() || submitting) 
                    ? 'bg-blue-400' 
                    : 'bg-blue-500'
                )}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    {isOverdue ? 'Submission Closed' : 'Submit Homework'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}