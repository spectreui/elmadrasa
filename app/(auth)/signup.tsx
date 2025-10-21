// app/(auth)/signup.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform } from
'react-native';
import Alert from '@/components/Alert';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { useTranslation } from "@/hooks/useTranslation";

interface Level {
  id: string;
  name: string;
  short_name: string;
  description: string;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  level_id: string;
}

export default function SignUp() {
  const { t } = useTranslation();
  const { fontFamily, colors } = useThemeContext();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'student' as 'student' | 'teacher',
    studentId: '',
    levelId: '',
    grade: '',
    classId: ''
  });

  // Dropdown data
  const [levels, setLevels] = useState<Level[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dropdown visibility
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  // Load levels on component mount
  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    setDataLoading(true);
    try {
      const response = await apiService.getLevels();
      if (response.success) {
        setLevels(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load levels:', error);
      Alert.alert(t("common.error"), t("auth.loadLevelsFailed"));
    } finally {
      setDataLoading(false);
    }
  };

  const loadGrades = async (levelId: string) => {
    setDataLoading(true);
    try {
      const response = await apiService.getGradesByLevel(levelId);
      if (response.success) {
        setGrades(response.data?.map((g: any) => g.name) || []);
        setClasses([]); // Reset classes when grade changes
      }
    } catch (error) {
      console.error('Failed to load grades:', error);
      Alert.alert(t("common.error"), t("auth.loadGradesFailed"));
    } finally {
      setDataLoading(false);
    }
  };

  // Add these helper functions at the top of signup.tsx
  const mapGradeToNumeric = (grade: string, levelShortName?: string): string => {
    // Handle Prep levels (1st, 2nd, 3rd -> 1, 2, 3)
    if (levelShortName === 'PREP') {
      const prepMap: {[key: string]: string;} = {
        '1st': '7',
        '2nd': '8',
        '3rd': '9',
        '7': '7',
        '8': '8',
        '9': '9'
      };
      return prepMap[grade] || grade;
    }

    // Handle Secondary levels (1st, 2nd, 3rd -> 10, 11, 12)
    if (levelShortName === 'SEC') {
      const secMap: {[key: string]: string;} = {
        '1st': '10',
        '2nd': '11',
        '3rd': '12',
        '10': '10',
        '11': '11',
        '12': '12'
      };
      return secMap[grade] || grade;
    }

    // Handle Primary levels (keep as is)
    if (levelShortName === 'PRI') {
      const primaryMap: {[key: string]: string;} = {
        '1': '1',
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
        '6': '6'
      };
      return primaryMap[grade] || grade;
    }

    // Default fallback mappings
    const defaultMap: {[key: string]: string;} = {
      '1st': '1',
      '2nd': '2',
      '3rd': '3',
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '1', // Map 7 to Prep 1
      '8': '2', // Map 8 to Prep 2
      '9': '3', // Map 9 to Prep 3
      '10': '10',
      '11': '11',
      '12': '12'
    };

    return defaultMap[grade] || grade;
  };

  const mapGradeToEgyptian = (grade: string, levelShortName?: string): string => {
    // For Prep levels, use 1st, 2nd, 3rd
    if (levelShortName === 'PREP') {
      const prepMap: {[key: string]: string;} = {
        '7': '1st',
        '8': '2nd',
        '9': '3rd'
      };
      return prepMap[grade] || grade;
    }

    // For Secondary levels, use 1st, 2nd, 3rd
    if (levelShortName === 'SEC') {
      const secMap: {[key: string]: string;} = {
        '10': '1st',
        '11': '2nd',
        '12': '3rd'
      };
      return secMap[grade] || grade;
    }

    // For Primary, just show the number
    if (levelShortName === 'PRI') {
      return grade;
    }

    // Default mappings
    const defaultMap: {[key: string]: string;} = {
      '1': '1st',
      '2': '2nd',
      '3': '3rd',
      '7': '1st',
      '8': '2nd',
      '9': '3rd',
      '10': '1st',
      '11': '2nd',
      '12': '3rd'
    };

    return defaultMap[grade] || grade;
  };

  const loadClasses = async (grade: string, levelId: string) => {
    setDataLoading(true);
    setClasses([]); // Clear previous classes immediately
    try {
      // Get level info to determine mapping
      const selectedLevel = levels.find((l) => l.id === levelId);
      const levelShortName = selectedLevel?.short_name;

      // Map to numeric value for API call
      const numericGrade = mapGradeToNumeric(grade, levelShortName);
      console.log('Loading classes for:', { grade: numericGrade, levelId });

      const response = await apiService.getClassesByGrade(numericGrade, levelId);
      if (response.success) {
        console.log('Loaded classes:', response.data);
        setClasses(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      Alert.alert(t("common.error"), t("auth.loadClassesFailed"));
    } finally {
      setDataLoading(false);
    }
  };

  const handleLevelSelect = (levelId: string) => {
    setFormData({
      ...formData,
      levelId,
      grade: '',
      classId: ''
    });
    setShowLevelDropdown(false);
    loadGrades(levelId);
  };

  const handleGradeSelect = (grade: string) => {
    setFormData({
      ...formData,
      grade,
      classId: ''
    });
    setShowGradeDropdown(false);

    // Ensure levelId exists before loading classes
    if (formData.levelId) {
      loadClasses(grade, formData.levelId);
    }
  };

  const handleClassSelect = (classId: string) => {
    setFormData({
      ...formData,
      classId
    });
    setShowClassDropdown(false);
  };

  const handleSignUp = async () => {
    // Validation
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert(t("common.error"), t("auth.fillRequiredFields"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordsDoNotMatch"));
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert(t("common.error"), t("auth.passwordLength"));
      return;
    }

    if (formData.role === 'student') {
      if (!formData.studentId) {
        Alert.alert(t("common.error"), t("auth.studentIdRequired"));
        return;
      }
      if (!formData.levelId || !formData.grade || !formData.classId) {
        Alert.alert(t("common.error"), t("auth.selectLevelGradeClass"));
        return;
      }
    }

    setLoading(true);

    try {
      // Get selected values for API
      const selectedLevel = levels.find((l) => l.id === formData.levelId);
      const selectedClass = classes.find((c) => c.id === formData.classId);

      // Map grade to Egyptian format for display
      const egyptianGrade = mapGradeToEgyptian(formData.grade);

      const signUpData = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        student_id: formData.role === 'student' ? formData.studentId : undefined,
        class_id: formData.role === 'student' ? formData.classId : undefined,
        profile: {
          name: formData.name,
          level: selectedLevel?.name || '',
          grade: egyptianGrade || '',
          class: selectedClass?.name || '',
          subjects: []
        }
      };

      console.log('Sending signup data:', signUpData);

      const response = await apiService.api.post('/auth/register', signUpData);

      if (response.data.success) {
        // Show success screen
        router.push({
          pathname: '/(auth)/signup-success',
          params: {
            role: formData.role,
            name: formData.name
          }
        });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert(
        t("common.error"),
        error.response?.data?.error || error.message || t("auth.registrationFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  // Get display names for selected items
  const getSelectedLevelName = () => {
    const level = levels.find((l) => l.id === formData.levelId);
    return level ? level.name : t("auth.selectLevel");
  };

  const getSelectedGradeName = () => {
    if (!formData.grade) return t("auth.selectGrade");
    return mapGradeToEgyptian(formData.grade);
  };

  const getSelectedClassName = () => {
    const cls = classes.find((c) => c.id === formData.classId);
    return cls ? cls.name : t("auth.selectClass");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>

        <View style={{
          flex: 1,
          minHeight: '100%',
          paddingHorizontal: designTokens.spacing.xl,
          paddingVertical: designTokens.spacing.xxxl
        }}>
          {/* Header */}
          <View style={{ marginBottom: designTokens.spacing.xxxl }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: designTokens.borderRadius.full,
                backgroundColor: colors.backgroundElevated,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: designTokens.spacing.xl,
                ...designTokens.shadows.sm
              }}>

              <Ionicons
                name="arrow-back"
                size={20}
                color={colors.textPrimary} />

            </TouchableOpacity>
            <Text style={{ fontFamily, 
              fontSize: designTokens.typography.largeTitle.fontSize,
              fontWeight: designTokens.typography.largeTitle.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.xs
            } as any}>
              {t("auth.createAccount")}
            </Text>
            <Text style={{ fontFamily, 
              fontSize: designTokens.typography.body.fontSize,
              color: colors.textSecondary
            }}>
              {t("auth.joinCommunity")}
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: designTokens.spacing.lg }}>
            {/* Name */}
            <View>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.sm
              }}>
                {t("auth.fullName")} *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: designTokens.borderRadius.xl,
                  padding: designTokens.spacing.lg,
                  backgroundColor: colors.backgroundElevated,
                  color: colors.textPrimary,
                  fontSize: designTokens.typography.body.fontSize
                }}
                placeholder={t("auth.enterFullName")}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor={colors.textTertiary} />

            </View>

            {/* Email */}
            <View>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.sm
              }}>
                {t("auth.emailAddress")} *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: designTokens.borderRadius.xl,
                  padding: designTokens.spacing.lg,
                  backgroundColor: colors.backgroundElevated,
                  color: colors.textPrimary,
                  fontSize: designTokens.typography.body.fontSize
                }}
                placeholder={t("auth.enterEmail")}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholderTextColor={colors.textTertiary} />

            </View>

            {/* Role Selection */}
            <View>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.md
              }}>
                {t("auth.iam")} *
              </Text>
              <View style={{
                flexDirection: 'row',
                gap: designTokens.spacing.sm
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: designTokens.spacing.lg,
                    borderRadius: designTokens.borderRadius.xl,
                    borderWidth: 2,
                    borderColor: formData.role === 'student' ? colors.primary : colors.border,
                    backgroundColor: formData.role === 'student' ? `${colors.primary}15` : colors.backgroundElevated,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: designTokens.spacing.sm
                  }}
                  onPress={() => setFormData({ ...formData, role: 'student' })}>

                  <Ionicons
                    name="school"
                    size={20}
                    color={formData.role === 'student' ? colors.primary : colors.textSecondary} />

                  <Text style={{ fontFamily, 
                    fontWeight: '600',
                    color: formData.role === 'student' ? colors.primary : colors.textPrimary,
                    fontSize: designTokens.typography.body.fontSize
                  }}>
                    {t("common.student")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: designTokens.spacing.lg,
                    borderRadius: designTokens.borderRadius.xl,
                    borderWidth: 2,
                    borderColor: formData.role === 'teacher' ? colors.primary : colors.border,
                    backgroundColor: formData.role === 'teacher' ? `${colors.primary}15` : colors.backgroundElevated,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: designTokens.spacing.sm
                  }}
                  onPress={() => setFormData({ ...formData, role: 'teacher' })}>

                  <Ionicons
                    name="person"
                    size={20}
                    color={formData.role === 'teacher' ? colors.primary : colors.textSecondary} />

                  <Text style={{ fontFamily, 
                    fontWeight: '600',
                    color: formData.role === 'teacher' ? colors.primary : colors.textPrimary,
                    fontSize: designTokens.typography.body.fontSize
                  }}>
                    {t("common.teacher")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Student-specific fields */}
            {formData.role === 'student' &&
            <>
                {/* Student ID */}
                <View>
                  <Text style={{ fontFamily, 
                  fontSize: designTokens.typography.footnote.fontSize,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.sm
                }}>
                    {t("auth.studentId")} *
                  </Text>
                  <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: designTokens.borderRadius.xl,
                    padding: designTokens.spacing.lg,
                    backgroundColor: colors.backgroundElevated,
                    color: colors.textPrimary,
                    fontSize: designTokens.typography.body.fontSize
                  }}
                  placeholder={t("auth.enterStudentId")}
                  value={formData.studentId}
                  onChangeText={(text) => setFormData({ ...formData, studentId: text })}
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="characters" />

                </View>

                {/* Level Dropdown */}
                <View>
                  <Text style={{ fontFamily, 
                  fontSize: designTokens.typography.footnote.fontSize,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.sm
                }}>
                    {t("auth.level")} *
                  </Text>
                  <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: designTokens.borderRadius.xl,
                    padding: designTokens.spacing.lg,
                    backgroundColor: colors.backgroundElevated,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    setShowLevelDropdown(!showLevelDropdown);
                    setShowGradeDropdown(false);
                    setShowClassDropdown(false);
                  }}>

                    <Text style={{ fontFamily, 
                    color: formData.levelId ? colors.textPrimary : colors.textTertiary,
                    fontSize: designTokens.typography.body.fontSize
                  }}>
                      {getSelectedLevelName()}
                    </Text>
                    <Ionicons
                    name={showLevelDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary} />

                  </TouchableOpacity>

                  {showLevelDropdown &&
                <View style={{
                  backgroundColor: colors.backgroundElevated,
                  borderRadius: designTokens.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginTop: designTokens.spacing.xs,
                  maxHeight: 200,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4
                    },
                    android: {
                      elevation: 3
                    }
                  })
                }}>
                      {dataLoading ?
                  <View style={{ padding: designTokens.spacing.lg }}>
                          <ActivityIndicator size="small" color={colors.primary} />
                        </View> :
                  levels.length === 0 ?
                  <View style={{ padding: designTokens.spacing.lg }}>
                          <Text style={{ fontFamily, 
                      color: colors.textSecondary,
                      textAlign: 'center',
                      fontSize: designTokens.typography.body.fontSize
                    }}>
                            {t("common.noItems")}
                          </Text>
                        </View> :

                  levels.map((level) =>
                  <TouchableOpacity
                    key={level.id}
                    style={{
                      padding: designTokens.spacing.lg,
                      borderBottomWidth: levels.indexOf(level) < levels.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border
                    }}
                    onPress={() => handleLevelSelect(level.id)}>

                            <Text style={{ fontFamily, 
                      color: colors.textPrimary,
                      fontSize: designTokens.typography.body.fontSize
                    }}>
                              {level.name}
                            </Text>
                          </TouchableOpacity>
                  )
                  }
                    </View>
                }
                </View>

                {/* Grade Dropdown */}
                <View>
                  <Text style={{ fontFamily, 
                  fontSize: designTokens.typography.footnote.fontSize,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.sm
                }}>
                    {t("auth.grade")} *
                  </Text>
                  <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: designTokens.borderRadius.xl,
                    padding: designTokens.spacing.lg,
                    backgroundColor: colors.backgroundElevated,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    if (formData.levelId) {
                      setShowGradeDropdown(!showGradeDropdown);
                      setShowLevelDropdown(false);
                      setShowClassDropdown(false);
                    } else {
                      Alert.alert(t("common.error"), t("auth.selectLevelFirst"));
                    }
                  }}
                  disabled={!formData.levelId}>

                    <Text style={{ fontFamily, 
                    color: formData.grade ? colors.textPrimary : colors.textTertiary,
                    fontSize: designTokens.typography.body.fontSize
                  }}>
                      {getSelectedGradeName()}
                    </Text>
                    <Ionicons
                    name={showGradeDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={formData.levelId ? colors.textSecondary : colors.textTertiary} />

                  </TouchableOpacity>

                  {showGradeDropdown && formData.levelId &&
                <View style={{
                  backgroundColor: colors.backgroundElevated,
                  borderRadius: designTokens.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginTop: designTokens.spacing.xs,
                  maxHeight: 200,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4
                    },
                    android: {
                      elevation: 3
                    }
                  })
                }}>
                      {dataLoading ?
                  <View style={{ padding: designTokens.spacing.lg }}>
                          <ActivityIndicator size="small" color={colors.primary} />
                        </View> :
                  grades.length === 0 ?
                  <View style={{ padding: designTokens.spacing.lg }}>
                          <Text style={{ fontFamily, 
                      color: colors.textSecondary,
                      textAlign: 'center',
                      fontSize: designTokens.typography.body.fontSize
                    }}>
                            {t("common.noItems")}
                          </Text>
                        </View> :

                  grades.map((grade, index) =>
                  <TouchableOpacity
                    key={index}
                    style={{
                      padding: designTokens.spacing.lg,
                      borderBottomWidth: index < grades.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border
                    }}
                    onPress={() => handleGradeSelect(grade)}>

                            <Text style={{ fontFamily, 
                      color: colors.textPrimary,
                      fontSize: designTokens.typography.body.fontSize
                    }}>
                              {mapGradeToEgyptian(grade)}
                            </Text>
                          </TouchableOpacity>
                  )
                  }
                    </View>
                }
                </View>

                {/* Class Dropdown */}
                <View>
                  <Text style={{ fontFamily, 
                  fontSize: designTokens.typography.footnote.fontSize,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.sm
                }}>
                    {t("auth.class")} *
                  </Text>
                  <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: designTokens.borderRadius.xl,
                    padding: designTokens.spacing.lg,
                    backgroundColor: colors.backgroundElevated,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onPress={() => {
                    if (formData.grade) {
                      setShowClassDropdown(!showClassDropdown);
                      setShowLevelDropdown(false);
                      setShowGradeDropdown(false);
                    } else {
                      Alert.alert(t("common.error"), t("auth.selectGradeFirst"));
                    }
                  }}
                  disabled={!formData.grade}>

                    <Text style={{ fontFamily, 
                    color: formData.classId ? colors.textPrimary : colors.textTertiary,
                    fontSize: designTokens.typography.body.fontSize
                  }}>
                      {getSelectedClassName()}
                    </Text>
                    <Ionicons
                    name={showClassDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={formData.grade ? colors.textSecondary : colors.textTertiary} />

                  </TouchableOpacity>

                  {showClassDropdown && formData.grade &&
                <View style={{
                  backgroundColor: colors.backgroundElevated,
                  borderRadius: designTokens.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginTop: designTokens.spacing.xs,
                  maxHeight: 200,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4
                    },
                    android: {
                      elevation: 3
                    }
                  })
                }}>
                      {dataLoading ?
                  <View style={{ padding: designTokens.spacing.lg }}>
                          <ActivityIndicator size="small" color={colors.primary} />
                        </View> :
                  classes.length === 0 ?
                  <View style={{ padding: designTokens.spacing.lg }}>
                          <Text style={{ fontFamily, 
                      color: colors.textSecondary,
                      textAlign: 'center',
                      fontSize: designTokens.typography.body.fontSize
                    }}>
                            {t("common.noItems")}
                          </Text>
                        </View> :

                  classes.map((cls) =>
                  <TouchableOpacity
                    key={cls.id}
                    style={{
                      padding: designTokens.spacing.lg,
                      borderBottomWidth: classes.indexOf(cls) < classes.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border
                    }}
                    onPress={() => handleClassSelect(cls.id)}>

                            <Text style={{ fontFamily, 
                      color: colors.textPrimary,
                      fontSize: designTokens.typography.body.fontSize
                    }}>
                              {cls.name}
                            </Text>
                          </TouchableOpacity>
                  )
                  }
                    </View>
                }
                </View>
              </>
            }

            {/* Password */}
            <View>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.sm
              }}>
                {t("common.password")} *
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: designTokens.borderRadius.xl,
                    padding: designTokens.spacing.lg,
                    backgroundColor: colors.backgroundElevated,
                    color: colors.textPrimary,
                    fontSize: designTokens.typography.body.fontSize,
                    paddingRight: 52
                  }}
                  placeholder={t("auth.enterPassword")}
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholderTextColor={colors.textTertiary} />

                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: designTokens.spacing.md,
                    top: 16
                  }}
                  onPress={() => setShowPassword(!showPassword)}>

                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color={colors.textTertiary} />

                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.sm
              }}>
                {t("auth.confirmPassword")} *
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: designTokens.borderRadius.xl,
                    padding: designTokens.spacing.lg,
                    backgroundColor: colors.backgroundElevated,
                    color: colors.textPrimary,
                    fontSize: designTokens.typography.body.fontSize,
                    paddingRight: 52
                  }}
                  placeholder={t("auth.confirmYourPassword")}
                  secureTextEntry={!showConfirmPassword}
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  placeholderTextColor={colors.textTertiary} />

                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: designTokens.spacing.md,
                    top: 16
                  }}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}>

                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={24}
                    color={colors.textTertiary} />

                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={{
                backgroundColor: loading ? colors.textTertiary : colors.primary,
                borderRadius: designTokens.borderRadius.xl,
                padding: designTokens.spacing.lg,
                alignItems: 'center',
                justifyContent: 'center',
                ...designTokens.shadows.md,
                marginTop: designTokens.spacing.lg
              }}
              onPress={handleSignUp}
              disabled={loading}>

              {loading ?
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={{ fontFamily, 
                  color: 'white',
                  fontWeight: '600',
                  fontSize: designTokens.typography.body.fontSize,
                  marginLeft: designTokens.spacing.sm
                }}>
                    {t("auth.creatingAccount")}
                  </Text>
                </View> :

              <Text style={{ fontFamily, 
                color: 'white',
                fontWeight: '600',
                fontSize: designTokens.typography.body.fontSize
              }}>
                  {t("auth.createAccount")}
                </Text>
              }
            </TouchableOpacity>

            {/* Sign In Link */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: designTokens.spacing.xxl
            }}>
              <Text style={{ fontFamily, 
                color: colors.textSecondary,
                fontSize: designTokens.typography.body.fontSize
              }}>
                {t("auth.haveAccount")}{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={{ fontFamily, 
                  color: colors.primary,
                  fontWeight: '600',
                  fontSize: designTokens.typography.body.fontSize
                }}>
                  {t("auth.signIn")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>);
}