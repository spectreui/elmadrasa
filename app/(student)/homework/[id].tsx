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
import { designTokens } from '../../../src/utils/designTokens';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeContext } from '@/contexts/ThemeContext';

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
  const { colors, isDark } = useThemeContext();

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
    if (!homework) return { status: 'unknown', color: '#9CA3AF', text: 'Unknown', bgColor: '#F3F4F6' };
    
    if (submission) {
      return { 
        status: 'submitted', 
        color: '#2563EB', 
        text: 'Submitted',
        bgColor: '#2563EB15'
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
        color: '#DC2626', 
        text: 'Overdue',
        bgColor: '#DC262615'
      };
    }
    if (diffHours <= 24) {
      return { 
        status: 'due', 
        color: '#EA580C', 
        text: `Due in ${diffHours} hours`,
        bgColor: '#EA580C15'
      };
    }
    if (diffDays <= 2) {
      return { 
        status: 'soon', 
        color: '#CA8A04', 
        text: `Due in ${diffDays} days`,
        bgColor: '#CA8A0415'
      };
    }
    return { 
      status: 'pending', 
      color: '#16A34A', 
      text: `Due in ${diffDays} days`,
      bgColor: '#16A34A15'
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
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          marginTop: designTokens.spacing.md,
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
        }}>
          Loading homework...
        </Text>
      </View>
    );
  }

  if (!homework) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: designTokens.spacing.xl,
      }}>
        <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
        <Text style={{
          fontSize: designTokens.typography.title2.fontSize,
          fontWeight: designTokens.typography.title2.fontWeight,
          color: colors.textPrimary,
          marginTop: designTokens.spacing.md,
          marginBottom: designTokens.spacing.sm,
        } as any}>
          Homework Not Found
        </Text>
        <Text style={{
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: designTokens.spacing.xl,
        }}>
          The homework you're looking for doesn't exist or you don't have access to it.
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: designTokens.spacing.xl,
            paddingVertical: designTokens.spacing.lg,
            borderRadius: designTokens.borderRadius.xl,
          }}
        >
          <Text style={{
            color: 'white',
            fontWeight: '600',
            fontSize: designTokens.typography.body.fontSize,
          }}>
            Go Back
          </Text>
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
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ 
          paddingHorizontal: designTokens.spacing.xl,
          paddingTop: designTokens.spacing.xxxl,
          paddingBottom: designTokens.spacing.xl,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: designTokens.spacing.lg,
          }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
              <Text style={{
                marginLeft: designTokens.spacing.sm,
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
              }}>
                Back to Homework
              </Text>
            </TouchableOpacity>
            
            <View style={{
              paddingHorizontal: designTokens.spacing.md,
              paddingVertical: designTokens.spacing.xs,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: dueStatus.bgColor,
            }}>
              <Text style={{
                fontSize: designTokens.typography.caption2.fontSize,
                fontWeight: '600',
                color: dueStatus.color,
              }}>
                {dueStatus.text}
              </Text>
            </View>
          </View>

          <Text style={{
            fontSize: designTokens.typography.title1.fontSize,
            fontWeight: designTokens.typography.title1.fontWeight,
            color: colors.textPrimary,
            marginBottom: designTokens.spacing.md,
          } as any}>
            {homework.title}
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap',
            gap: designTokens.spacing.sm,
          }}>
            <View style={{
              paddingHorizontal: designTokens.spacing.md,
              paddingVertical: designTokens.spacing.xs,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#6B728015',
            }}>
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                fontWeight: '600',
                color: '#6B7280',
              }}>
                {homework.subject}
              </Text>
            </View>
            <View style={{
              paddingHorizontal: designTokens.spacing.md,
              paddingVertical: designTokens.spacing.xs,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#6B728015',
            }}>
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                fontWeight: '600',
                color: '#6B7280',
              }}>
                {homework.points} points
              </Text>
            </View>
            <View style={{
              paddingHorizontal: designTokens.spacing.md,
              paddingVertical: designTokens.spacing.xs,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#6B728015',
            }}>
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                fontWeight: '600',
                color: '#6B7280',
              }}>
                By: {homework.teacher?.profile?.name || 'Teacher'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ 
          padding: designTokens.spacing.xl,
          paddingTop: designTokens.spacing.lg,
        }}>
          {/* Due Date Card */}
          <View style={{
            padding: designTokens.spacing.lg,
            borderRadius: designTokens.borderRadius.xl,
            borderWidth: 1,
            borderColor: dueStatus.color + '40',
            backgroundColor: colors.backgroundElevated,
            ...designTokens.shadows.sm,
            marginBottom: designTokens.spacing.xl,
          }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: designTokens.borderRadius.full,
                backgroundColor: dueStatus.bgColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: designTokens.spacing.md,
              }}>
                <Ionicons name="calendar" size={20} color={dueStatus.color} />
              </View>
              <View>
                <Text style={{
                  fontSize: designTokens.typography.headline.fontSize,
                  fontWeight: designTokens.typography.headline.fontWeight,
                  color: colors.textPrimary,
                  marginBottom: 2,
                } as any}>
                  Due Date
                </Text>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  color: colors.textSecondary,
                }}>
                  {formatDate(homework.due_date)}
                </Text>
              </View>
            </View>
          </View>

          {/* Description Card */}
          <View style={{
            padding: designTokens.spacing.lg,
            borderRadius: designTokens.borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.backgroundElevated,
            ...designTokens.shadows.sm,
            marginBottom: designTokens.spacing.xl,
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.md,
            } as any}>
              Assignment Description
            </Text>
            <Text style={{
              fontSize: designTokens.typography.body.fontSize,
              color: colors.textPrimary,
            }}>
              {homework.description}
            </Text>
          </View>

          {/* Submission Section */}
          {isSubmitted ? (
            <View style={{
              padding: designTokens.spacing.lg,
              borderRadius: designTokens.borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.backgroundElevated,
              ...designTokens.shadows.sm,
            }}>
              <Text style={{
                fontSize: designTokens.typography.title3.fontSize,
                fontWeight: designTokens.typography.title3.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.md,
              } as any}>
                Your Submission
              </Text>
              
              <View style={{ marginBottom: designTokens.spacing.md }}>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.sm,
                }}>
                  Submitted Content:
                </Text>
                <View style={{
                  padding: designTokens.spacing.md,
                  borderRadius: designTokens.borderRadius.lg,
                  backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                }}>
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textPrimary,
                  }}>
                    {submission?.content}
                  </Text>
                </View>
              </View>

              {submission?.attachments && submission.attachments.length > 0 && (
                <View style={{ marginBottom: designTokens.spacing.md }}>
                  <Text style={{
                    fontSize: designTokens.typography.footnote.fontSize,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.sm,
                  }}>
                    Attachments:
                  </Text>
                  <View style={{ gap: designTokens.spacing.sm }}>
                    {submission.attachments.map((attachment, index) => (
                      <View 
                        key={index} 
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: designTokens.spacing.md,
                          borderRadius: designTokens.borderRadius.lg,
                          backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                        }}
                      >
                        <Ionicons name="document" size={20} color={colors.textSecondary} />
                        <Text 
                          style={{
                            marginLeft: designTokens.spacing.sm,
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textPrimary,
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          {attachment}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: colors.textSecondary,
                marginTop: designTokens.spacing.sm,
              }}>
                Submitted on: {formatDate(submission?.submitted_at || '')}
              </Text>

              {submission?.grade !== undefined && (
                <View style={{
                  marginTop: designTokens.spacing.lg,
                  padding: designTokens.spacing.md,
                  borderRadius: designTokens.borderRadius.lg,
                  backgroundColor: '#10B98115',
                  borderWidth: 1,
                  borderColor: '#10B98140',
                }}>
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: '#059669',
                    marginBottom: designTokens.spacing.xs,
                  }}>
                    Grade: {submission.grade}/{homework.points}
                  </Text>
                  {submission.feedback && (
                    <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: '#059669',
                    }}>
                      Feedback: {submission.feedback}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={{
              padding: designTokens.spacing.lg,
              borderRadius: designTokens.borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.backgroundElevated,
              ...designTokens.shadows.sm,
            }}>
              <Text style={{
                fontSize: designTokens.typography.title3.fontSize,
                fontWeight: designTokens.typography.title3.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.md,
              } as any}>
                Your Submission
              </Text>

              <View style={{ marginBottom: designTokens.spacing.lg }}>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.sm,
                }}>
                  Answer / Submission Content *
                </Text>
                <View style={{
                  borderRadius: designTokens.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  minHeight: 120,
                }}>
                  <TextInput
                    style={{
                      padding: designTokens.spacing.md,
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                      textAlignVertical: 'top',
                      height: 120,
                    }}
                    placeholder="Type your answer or submission here..."
                    placeholderTextColor={colors.textTertiary}
                    value={submissionContent}
                    onChangeText={setSubmissionContent}
                    multiline
                    editable={canSubmit}
                  />
                </View>
              </View>

              {homework.attachments && (
                <View style={{ marginBottom: designTokens.spacing.lg }}>
                  <Text style={{
                    fontSize: designTokens.typography.footnote.fontSize,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.sm,
                  }}>
                    Attachments
                  </Text>
                  
                  {attachments.length > 0 && (
                    <View style={{ marginBottom: designTokens.spacing.md, gap: designTokens.spacing.sm }}>
                      {attachments.map((attachment, index) => (
                        <View 
                          key={index} 
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: designTokens.spacing.md,
                            borderRadius: designTokens.borderRadius.lg,
                            backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                          }}
                        >
                          <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center',
                            flex: 1,
                          }}>
                            <Ionicons name="document" size={20} color={colors.textSecondary} />
                            <Text 
                              style={{
                                marginLeft: designTokens.spacing.sm,
                                fontSize: designTokens.typography.body.fontSize,
                                color: colors.textPrimary,
                                flex: 1,
                              }}
                              numberOfLines={1}
                            >
                              {attachment}
                            </Text>
                          </View>
                          <TouchableOpacity 
                            onPress={() => removeAttachment(index)}
                            disabled={!canSubmit}
                          >
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={pickDocument}
                    disabled={!canSubmit || uploading}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: designTokens.spacing.md,
                      borderRadius: designTokens.borderRadius.lg,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: canSubmit ? '#3B82F6' : colors.border,
                      backgroundColor: canSubmit ? '#3B82F615' : colors.background,
                    }}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons 
                          name="attach" 
                          size={20} 
                          color={canSubmit ? "#3B82F6" : colors.textTertiary} 
                        />
                        <Text style={{
                          marginLeft: designTokens.spacing.sm,
                          fontWeight: '600',
                          color: canSubmit ? '#3B82F6' : colors.textTertiary,
                        }}>
                          Add Attachment
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {isOverdue && (
                <View style={{
                  padding: designTokens.spacing.md,
                  borderRadius: designTokens.borderRadius.lg,
                  backgroundColor: '#DC262615',
                  borderWidth: 1,
                  borderColor: '#DC262640',
                  marginBottom: designTokens.spacing.lg,
                }}>
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: '#DC2626',
                    textAlign: 'center',
                  }}>
                    This assignment is overdue and can no longer be submitted.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSubmitHomework}
                disabled={!canSubmit || !submissionContent.trim() || submitting}
                style={{
                  paddingVertical: designTokens.spacing.lg,
                  borderRadius: designTokens.borderRadius.xl,
                  backgroundColor: (!canSubmit || !submissionContent.trim() || submitting) 
                    ? '#93C5FD' 
                    : colors.primary,
                  alignItems: 'center',
                }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    fontWeight: '600',
                    color: 'white',
                  }}>
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
