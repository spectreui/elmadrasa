import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export const linking = {
  prefixes: ['https://elmadrasa.vercel.app', 'elmadrasa://'],
  config: {
    screens: {
      // Auth screens
      '(auth)': {
        path: '(auth)',
        screens: {
          login: 'login',
          signup: 'signup',
          'signup-success': 'signup-success',
        },
      },
      // Student screens
      '(student)': {
        path: '(student)',
        screens: {
          index: '',
          homework: 'homework',
          exams: 'exams',
          results: 'results',
          profile: 'profile',
          'join-subject': 'join-subject',
          // Dynamic routes
          'homework/[id]': 'homework/:id',
          'exam/[id]': 'exam/:id',
          'exam/results/[id]': 'exam/results/:id',
        },
      },
      // Teacher screens
      '(teacher)': {
        path: '(teacher)',
        screens: {
          index: '',
          profile: 'profile',
          'create-exam': 'create-exam',
          statistics: 'statistics',
          'my-classes': 'classes',
          // Homework routes
          'homework/index': 'homework',
          'homework/create': 'homework/create',
          'homework/[id]/submissions': 'homework/:id/submissions',
          // Exam routes
          'exams/[id]': 'exams/:id',
          'exam-results/[id]': 'exam-results/:id',
          'exams': 'exams',
        },
      },
      // Admin screens
      '(admin)': {
        path: '(admin)',
        screens: {
          index: '',
          settings: 'settings',
          students: 'students',
          teachers: 'teachers',
          approvals: 'approvals',
          classes: 'classes',
          users: 'users',
          'assign-teachers': 'assign-teachers',
        },
      },
      // Root screens
      index: '',
    },
  },
};

export const handleDeepLink = async (url: string) => {
  try {
    console.log('Handling deep link:', url);

    // Parse the URL to extract path and parameters
    const parsed = Linking.parse(url);
    console.log('Parsed URL:', parsed);

    if (parsed.path) {
      // Navigate to the appropriate screen
      await navigateToScreen(parsed.path, parsed.queryParams || {});
    }
  } catch (error) {
    console.error('Error handling deep link:', error);
  }
};

const navigateToScreen = async (path: string, params: any = {}) => {
  try {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    console.log('Navigating to:', cleanPath, params);

    // Navigate using expo-router
    router.push({
      pathname: `/${cleanPath}`,
      params
    });

  } catch (error) {
    console.error('Error navigating to screen:', error);
  }
};

// Utility function to generate web URLs that work for both web and app
export const generateUniversalLink = (path: string, params: Record<string, string> = {}) => {
  const baseUrl = 'https://elmadrasa.vercel.app';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  let url = `${baseUrl}${cleanPath}`;

  if (Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams(params).toString();
    url += `?${queryParams}`;
  }

  return url;
};

// Generate universal link for current page
export const generateCurrentPageLink = (path: string, params: Record<string, string> = {}) => {
  const WEB_BASE_URL = 'https://elmadrasa.vercel.app';

  // Clean the path
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // Construct the URL
  let url = `${WEB_BASE_URL}/${cleanPath}`;

  // Add query parameters
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  return url;
};

// Specific link generators for common pages
export const generateHomeworkLink = (homeworkId?: string, additionalParams: Record<string, string> = {}) => {
  return generateCurrentPageLink(`homework/${homeworkId}`, additionalParams);
};

export const generateExamLink = (examId: string, additionalParams: Record<string, string> = {}) => {
  return generateCurrentPageLink(`exam/${examId}`, additionalParams);
};

export const generateTeacherHomeworkLink = (homeworkId: string, additionalParams: Record<string, string> = {}) => {
  return generateCurrentPageLink(`homework/${homeworkId}/submissions`, additionalParams);
};

// Generic function to generate link for any current route
export const generateLinkForCurrentRoute = (routeName: string, params: Record<string, string> = {}) => {
  const routeMap: Record<string, string> = {
    'student-homework-detail': 'student/homework/:id',
    'student-exam-detail': 'student/exam/:id',
    'teacher-homework-submissions': 'teacher/homework/:id/submissions',
    'teacher-create-exam': 'teacher/create-exam',
    'student-dashboard': 'student',
    'teacher-dashboard': 'teacher',
    'login': 'login',
    // Add more routes as needed
  };

  const basePath = routeMap[routeName];
  if (!basePath) {
    // Fallback to generic path construction
    return generateCurrentPageLink(routeName.replace(/-/g, '/'), params);
  }

  // Replace parameter placeholders
  let finalPath = basePath;
  Object.entries(params).forEach(([key, value]) => {
    finalPath = finalPath.replace(`:${key}`, value);
  });

  return generateCurrentPageLink(finalPath, params);
};