// src/utils/linking.ts
import Constants from 'expo-constants';

// Generate universal link that works for both web and app
export const generateUniversalLink = (path: string, params?: Record<string, string>) => {
  // For web, use your actual domain
  const webBaseUrl = 'https://elmadrasa.vercel.app'; // Replace with your actual domain
  const appScheme = 'elmadrasa'; // Replace with your app scheme
  
  // Construct the path with parameters
  let fullPath = path;
  if (params) {
    const queryParams = new URLSearchParams(params).toString();
    if (queryParams) {
      fullPath += `?${queryParams}`;
    }
  }
  
  // Return web URL for universal access
  return `${webBaseUrl}${fullPath}`;
};

// Generate homework-specific link
export const generateHomeworkLink = (homeworkId: string, params?: { subject?: string; title?: string }) => {
  return generateUniversalLink(`/(student)/homework/${homeworkId}`, params);
};

// Generate exam-specific link
export const generateExamLink = (examId: string, params?: { subject?: string; title?: string }) => {
  return generateUniversalLink(`/(student)/exam/${examId}`, params);
};

// Generate exam results link
export const generateExamResultsLink = (submissionId: string, params?: { title?: string }) => {
  return generateUniversalLink(`/(student)/exam/results/${submissionId}`, params);
};
