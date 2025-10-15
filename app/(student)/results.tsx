// app/(student)/results.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Alert from "@blazejkustra/react-native-alert";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../src/contexts/ThemeContext";
import { designTokens } from "../../src/utils/designTokens";
import Animated, { FadeIn } from "react-native-reanimated";

export default function ResultsScreen() {
  const { user } = useAuth();
  const { colors } = useThemeContext();
  const [results, setResults] = useState<any[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "recent" | "top">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);

      console.log("🔄 Loading student results...");
      console.log("🔐 Current API token:", apiService.getToken() ? 'Present' : 'Missing');

      // Load exam results from real API
      const resultsResponse = await apiService.getStudentResults();
      console.log("📊 Results API response:", {
        success: resultsResponse.data.success,
        dataLength: resultsResponse.data.data?.length || 0,
        error: resultsResponse.data.error
      });

      if (resultsResponse.data.success) {
        setResults(
          Array.isArray(resultsResponse.data.data)
            ? resultsResponse.data.data
            : []
        );
      } else {
        console.error("Failed to load results:", resultsResponse.data.error);
        Alert.alert("Error", "Failed to load results");
      }

      // Load subject performance from real API
      const performanceResponse = await apiService.getSubjectPerformance();
      console.log("📈 Performance API response:", {
        success: performanceResponse.data.success,
        dataLength: performanceResponse.data.data?.length || 0,
        error: performanceResponse.data.error
      });

      if (performanceResponse.data.success) {
        setSubjectPerformance(
          Array.isArray(performanceResponse.data.data)
            ? performanceResponse.data.data
            : []
        );
      } else {
        console.error(
          "Failed to load performance:",
          performanceResponse.data.error
        );
      }
    } catch (error: any) {
      console.error("❌ Failed to load results:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert("Error", "Failed to load results data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadResults();
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return { text: '#34C759', bg: '#34C75915', border: '#34C759' };
    if (percentage >= 80) return { text: '#007AFF', bg: '#007AFF15', border: '#007AFF' };
    if (percentage >= 70) return { text: '#FFCC00', bg: '#FFCC0015', border: '#FFCC00' };
    return { text: '#FF3B30', bg: '#FF3B3015', border: '#FF3B30' };
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const filteredResults = results.filter((result) => {
    if (selectedFilter === "recent") {
      return results.indexOf(result) < 5; // Last 5 results
    }
    if (selectedFilter === "top") {
      return result.percentage >= 80;
    }
    return true;
  });

  const ResultCard = ({ result }: { result: any }) => {
    const gradeColors = getGradeColor(result.percentage);

    return (
      <View
        style={{
          backgroundColor: colors.backgroundElevated,
          borderRadius: designTokens.borderRadius.xl,
          padding: designTokens.spacing.lg,
          ...designTokens.shadows.sm,
          marginBottom: designTokens.spacing.sm,
        }}
      >
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: designTokens.spacing.md,
        }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: designTokens.typography.headline.fontSize,
                fontWeight: designTokens.typography.headline.fontWeight as any,
                color: colors.textPrimary,
                marginBottom: 2,
              }}
              numberOfLines={1}
            >
              {result.examTitle}
            </Text>
            <Text
              style={{
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
              }}
            >
              {result.subject} • {new Date(result.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={{
            backgroundColor: gradeColors.bg,
            paddingHorizontal: designTokens.spacing.md,
            paddingVertical: designTokens.spacing.xs,
            borderRadius: designTokens.borderRadius.full,
            borderWidth: 1,
            borderColor: gradeColors.border,
          }}>
            <Text
              style={{
                fontSize: designTokens.typography.headline.fontSize,
                fontWeight: designTokens.typography.headline.fontWeight as any,
                color: gradeColors.text,
              }}
            >
              {getGradeLabel(result.percentage)}
            </Text>
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: designTokens.spacing.md,
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: designTokens.typography.title2.fontSize,
                fontWeight: designTokens.typography.title2.fontWeight,
                color: colors.textPrimary,
                marginBottom: 2,
              } as any}
            >
              {result.percentage}%
            </Text>
            <Text
              style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: colors.textSecondary,
              }}
            >
              Score
            </Text>
          </View>
          <View style={{
            height: 30,
            width: 1,
            backgroundColor: colors.separator
          }} />
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: designTokens.typography.title3.fontSize,
                fontWeight: designTokens.typography.title3.fontWeight,
                color: colors.textPrimary,
                marginBottom: 2,
              } as any}
            >
              {result.correctAnswers}/{result.totalQuestions}
            </Text>
            <Text
              style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: colors.textSecondary,
              }}
            >
              Correct
            </Text>
          </View>
          <View style={{
            height: 30,
            width: 1,
            backgroundColor: colors.separator
          }} />
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: designTokens.typography.title3.fontSize,
                fontWeight: designTokens.typography.title3.fontWeight,
                color: colors.textPrimary,
                marginBottom: 2,
              } as any}
            >
              {result.timeSpent}
            </Text>
            <Text
              style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: colors.textSecondary,
              }}
            >
              Time
            </Text>
          </View>
        </View>

        <View style={{
          width: '100%',
          height: 6,
          backgroundColor: colors.separator,
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <View
            style={{
              height: '100%',
              width: `${result.percentage}%`,
              backgroundColor: gradeColors.text,
              borderRadius: 3,
            }}
          />
        </View>
      </View>
    );
  };

  const SubjectPerformanceCard = ({ subject }: { subject: any }) => (
    <View
      style={{
        backgroundColor: colors.backgroundElevated,
        borderRadius: designTokens.borderRadius.xl,
        padding: designTokens.spacing.lg,
        ...designTokens.shadows.sm,
        minWidth: 140,
        marginRight: designTokens.spacing.sm,
      }}
    >
      <Text
        style={{
          fontSize: designTokens.typography.footnote.fontSize,
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: designTokens.spacing.sm,
        }}
        numberOfLines={1}
      >
        {subject.subject}
      </Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
      }}>
        <Text
          style={{
            fontSize: designTokens.typography.title1.fontSize,
            fontWeight: designTokens.typography.title1.fontWeight,
            color: colors.textPrimary,
          } as any}
        >
          {subject.averageScore}%
        </Text>
        <Ionicons
          name={
            subject.trend === "up"
              ? "trending-up"
              : subject.trend === "down"
                ? "trending-down"
                : "remove"
          }
          size={16}
          color={
            subject.trend === "up"
              ? "#34C759"
              : subject.trend === "down"
                ? "#FF3B30"
                : "#8E8E93"
          }
        />
      </View>
      <Text
        style={{
          fontSize: designTokens.typography.caption1.fontSize,
          color: colors.textSecondary,
        }}
      >
        {subject.examsTaken} exams
      </Text>
    </View>
  );

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
          Loading your results...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: designTokens.spacing.xxxl,
        paddingHorizontal: designTokens.spacing.xl,
        paddingBottom: designTokens.spacing.lg,
      }}>
        <Text style={{
          fontSize: designTokens.typography.largeTitle.fontSize,
          fontWeight: designTokens.typography.largeTitle.fontWeight,
          color: colors.textPrimary,
          marginBottom: designTokens.spacing.xs,
        } as any}>
          Exam Results
        </Text>
        <Text style={{
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
        }}>
          Your performance overview and detailed results
        </Text>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        entering={FadeIn.duration(600)} // Smooth fade-in when screen loads
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{
          paddingHorizontal: designTokens.spacing.xl,
          paddingBottom: designTokens.spacing.xxxl,
        }}>
          {/* Performance Overview */}
          <View style={{ marginBottom: designTokens.spacing.xl }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.md,
            } as any}>
              Performance Overview
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: designTokens.spacing.sm
              }}
            >
              <View style={{ flexDirection: 'row' }}>
                {subjectPerformance.map((subject, index) => (
                  <SubjectPerformanceCard key={index} subject={subject} />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Filter Tabs */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: colors.separator,
            borderRadius: designTokens.borderRadius.full,
            padding: 2,
            marginBottom: designTokens.spacing.xl,
          }}>
            {[
              { key: "all", label: "All Results" },
              { key: "recent", label: "Recent" },
              { key: "top", label: "Top Scores" },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={{
                  flex: 1,
                  paddingVertical: designTokens.spacing.sm,
                  borderRadius: designTokens.borderRadius.full,
                  backgroundColor: selectedFilter === filter.key ? colors.backgroundElevated : 'transparent',
                }}
                onPress={() => setSelectedFilter(filter.key as any)}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: designTokens.typography.footnote.fontSize,
                    fontWeight: '600',
                    color: selectedFilter === filter.key
                      ? colors.textPrimary
                      : colors.textSecondary,
                  }}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Results List */}
          <View style={{ marginBottom: designTokens.spacing.xl }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.md,
            } as any}>
              {selectedFilter === "recent"
                ? "Recent Results"
                : selectedFilter === "top"
                  ? "Top Performances"
                  : "All Results"}
            </Text>

            {filteredResults.length === 0 ? (
              <View style={{
                backgroundColor: colors.backgroundElevated,
                borderRadius: designTokens.borderRadius.xl,
                padding: designTokens.spacing.xxl,
                alignItems: 'center',
                ...designTokens.shadows.sm,
              }}>
                <Ionicons name="stats-chart" size={48} color={colors.textTertiary} />
                <Text style={{
                  fontSize: designTokens.typography.title3.fontSize,
                  fontWeight: designTokens.typography.title3.fontWeight,
                  color: colors.textPrimary,
                  marginTop: designTokens.spacing.md,
                  marginBottom: designTokens.spacing.xs,
                } as any}>
                  No results found
                </Text>
                <Text style={{
                  fontSize: designTokens.typography.body.fontSize,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 22,
                }}>
                  {selectedFilter === "top"
                    ? "No top scores yet"
                    : "Complete some exams to see your results here"}
                </Text>
              </View>
            ) : (
              filteredResults.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))
            )}
          </View>

          {/* Overall Stats */}
          <View
            style={{
              backgroundColor: colors.backgroundElevated,
              borderRadius: designTokens.borderRadius.xl,
              padding: designTokens.spacing.lg,
              ...designTokens.shadows.sm,
            }}
          >
            <Text
              style={{
                fontSize: designTokens.typography.title3.fontSize,
                fontWeight: designTokens.typography.title3.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.md,
              } as any}
            >
              Summary
            </Text>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginHorizontal: -designTokens.spacing.xs,
            }}>
              <View style={{
                width: '50%',
                paddingHorizontal: designTokens.spacing.xs,
                marginBottom: designTokens.spacing.md,
              }}>
                <Text
                  style={{
                    fontSize: designTokens.typography.caption1.fontSize,
                    color: colors.textSecondary,
                    marginBottom: 2,
                  }}
                >
                  Total Exams
                </Text>
                <Text
                  style={{
                    fontSize: designTokens.typography.title2.fontSize,
                    fontWeight: designTokens.typography.title2.fontWeight,
                    color: colors.textPrimary,
                  } as any}
                >
                  {results.length}
                </Text>
              </View>
              <View style={{
                width: '50%',
                paddingHorizontal: designTokens.spacing.xs,
                marginBottom: designTokens.spacing.md,
              }}>
                <Text
                  style={{
                    fontSize: designTokens.typography.caption1.fontSize,
                    color: colors.textSecondary,
                    marginBottom: 2,
                  }}
                >
                  Average Score
                </Text>
                <Text
                  style={{
                    fontSize: designTokens.typography.title2.fontSize,
                    fontWeight: designTokens.typography.title2.fontWeight,
                    color: colors.textPrimary,
                  } as any}
                >
                  {results.length > 0
                    ? Math.round(
                      results.reduce((sum, r) => sum + r.percentage, 0) /
                      results.length
                    )
                    : 0}%
                </Text>
              </View>
              <View style={{
                width: '50%',
                paddingHorizontal: designTokens.spacing.xs,
              }}>
                <Text
                  style={{
                    fontSize: designTokens.typography.caption1.fontSize,
                    color: colors.textSecondary,
                    marginBottom: 2,
                  }}
                >
                  Best Subject
                </Text>
                <Text
                  style={{
                    fontSize: designTokens.typography.title2.fontSize,
                    fontWeight: designTokens.typography.title2.fontWeight,
                    color: colors.textPrimary,
                  } as any}
                >
                  {subjectPerformance.length > 0
                    ? subjectPerformance.reduce((best, current) =>
                      current.averageScore > best.averageScore ? current : best
                    ).subject
                    : "N/A"}
                </Text>
              </View>
              <View style={{
                width: '50%',
                paddingHorizontal: designTokens.spacing.xs,
              }}>
                <Text
                  style={{
                    fontSize: designTokens.typography.caption1.fontSize,
                    color: colors.textSecondary,
                    marginBottom: 2,
                  }}
                >
                  Total Time
                </Text>
                <Text
                  style={{
                    fontSize: designTokens.typography.title2.fontSize,
                    fontWeight: designTokens.typography.title2.fontWeight,
                    color: colors.textPrimary,
                  } as any}
                >
                  {results.reduce((total, result) => {
                    const time = parseInt(result.timeSpent);
                    return total + (isNaN(time) ? 0 : time);
                  }, 0)}m
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
