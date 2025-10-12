import * as Linking from 'expo-linking';

export const handleDeepLink = (url: string) => {
  const { path, queryParams } = Linking.parse(url);
  
  return { path, queryParams };
};

// Generate shareable links
export const generateHomeworkLink = (homeworkId: string) => {
  return `https://elmadrasa-link.vercel.app/api/resolve?type=homework&id=${homeworkId}`;
};

export const generateExamLink = (examId: string) => {
  return `https://elmadrasa-link.vercel.app/api/resolve?type=exam&id=${examId}`;
};

