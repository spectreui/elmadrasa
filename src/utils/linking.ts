import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export const handleDeepLink = (url: string) => {
  const { path, queryParams } = Linking.parse(url);
  
  console.log('🔗 Handling deep link:', { path, queryParams });
  
  switch (path) {
    case 'homework':
      if (queryParams?.id) {
        router.push(`/homework/${queryParams.id}`);
      } else {
        router.push('/homework');
      }
      break;
    case 'exam':
      if (queryParams?.id) {
        router.push(`/exams/${queryParams.id}`);
      } else {
        router.push('/exams');
      }
      break;
    case 'profile':
      router.push('/profile');
      break;
    case 'dashboard':
      router.push('/');
      break;
    default:
      // Don't redirect to home, just let the app load normally
      break;
  }
};

// Generate shareable links
export const generateHomeworkLink = (homeworkId: string) => {
  return Linking.createURL(`homework?id=${homeworkId}`);
};

export const generateExamLink = (examId: string) => {
  return Linking.createURL(`exam?id=${examId}`);
};
