// components/PageTitleHandler.tsx
import { usePathname, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

const routeTitles: Record<string, string> = {
  // Public routes
  '/': 'El Madrasa - Learn Better',
  '/login': 'Login - El Madrasa',
  '/signup': 'Sign Up - El Madrasa',
  '/signup-success': 'Sign Up Successful - El Madrasa',
  '/network-error': 'Network Error - El Madrasa',
  '/unauthorized': 'Unauthorized Access - El Madrasa',
  '/not-found': 'Page Not Found - El Madrasa',

  // Student routes
  '/(student)': 'Student Dashboard - El Madrasa',
  '/(student)/': 'Student Dashboard - El Madrasa',
  '/(student)/dashboard': 'Student Dashboard - El Madrasa',
  '/(student)/homework': 'My Homework - El Madrasa',
  '/(student)/homework/[id]': 'Homework Details - El Madrasa',
  '/(student)/exams': 'My Exams - El Madrasa',
  '/(student)/exam/[id]': 'Take Exam - El Madrasa',
  '/(student)/exam/results/[id]': 'Exam Results - El Madrasa',
  '/(student)/results': 'My Results - El Madrasa',
  '/(student)/join-subject': 'Join Subject - El Madrasa',
  '/(student)/profile': 'My Profile - El Madrasa',

  // Teacher routes
  '/(teacher)': 'Teacher Dashboard - El Madrasa',
  '/(teacher)/': 'Teacher Dashboard - El Madrasa',
  '/(teacher)/dashboard': 'Teacher Dashboard - El Madrasa',
  '/(teacher)/activity': 'Class Activity - El Madrasa',
  '/(teacher)/my-classes': 'My Classes - El Madrasa',
  '/(teacher)/statistics': 'Statistics - El Madrasa',
  '/(teacher)/profile': 'Teacher Profile - El Madrasa',
  '/(teacher)/create-exam': 'Create Exam - El Madrasa',
  '/(teacher)/homework': 'Homework Management - El Madrasa',
  '/(teacher)/homework/create': 'Create Homework - El Madrasa',
  '/(teacher)/homework/[id]': 'Homework Details - El Madrasa',
  '/(teacher)/homework/edit/[id]': 'Edit Homework - El Madrasa',
  '/(teacher)/homework/[id]/submissions': 'Homework Submissions - El Madrasa',
  '/(teacher)/exams': 'Exam Management - El Madrasa',
  '/(teacher)/exams/[id]': 'Exam Details - El Madrasa',
  '/(teacher)/exams/grading': 'Grade Exams - El Madrasa',
  '/(teacher)/exams/grading/[id]': 'Grade Exam - El Madrasa',
  '/(teacher)/exam-results/[id]': 'Exam Results - El Madrasa',

  // Admin routes
  '/(admin)': 'Admin Dashboard - El Madrasa',
  '/(admin)/': 'Admin Dashboard - El Madrasa',
  '/(admin)/dashboard': 'Admin Dashboard - El Madrasa',
  '/(admin)/users': 'User Management - El Madrasa',
  '/(admin)/students': 'Student Management - El Madrasa',
  '/(admin)/teachers': 'Teacher Management - El Madrasa',
  '/(admin)/classes': 'Class Management - El Madrasa',
  '/(admin)/approvals': 'Pending Approvals - El Madrasa',
  '/(admin)/settings': 'System Settings - El Madrasa',
  '/(admin)/assign-teachers': 'Assign Teachers - El Madrasa',
};

// Dynamic title generators for routes with parameters
const dynamicTitleGenerators: Record<string, (params: any, user: any) => string> = {
  '/(student)/homework/[id]': (params, user) => `Homework - ${params.id || 'Details'} - El Madrasa`,
  '/(student)/exam/[id]': (params, user) => `Exam - ${params.id || 'Take Exam'} - El Madrasa`,
  '/(student)/exam/results/[id]': (params, user) => `Exam Results - ${params.id || 'Details'} - El Madrasa`,
  '/(teacher)/homework/[id]': (params, user) => `Homework - ${params.id || 'Details'} - El Madrasa`,
  '/(teacher)/homework/edit/[id]': (params, user) => `Edit Homework - ${params.id || 'Details'} - El Madrasa`,
  '/(teacher)/homework/[id]/submissions': (params, user) => `Submissions - ${params.id || 'Homework'} - El Madrasa`,
  '/(teacher)/exams/[id]': (params, user) => `Exam - ${params.id || 'Details'} - El Madrasa`,
  '/(teacher)/exams/grading/[id]': (params, user) => `Grade Exam - ${params.id || 'Details'} - El Madrasa`,
  '/(teacher)/exam-results/[id]': (params, user) => `Results - ${params.id || 'Exam'} - El Madrasa`,
};

export function PageTitleHandler() {
  const pathname = usePathname();
  const segments = useSegments();
  const { user } = useAuth();
  const { t, language } = useTranslation();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    let title = 'El Madrasa - Learn Better';
    
    // Try exact match first
    if (routeTitles[pathname]) {
      title = routeTitles[pathname];
    } else {
      // Try to match dynamic routes
      const pathSegments = pathname.split('/');
      
      for (const [routePattern, generator] of Object.entries(dynamicTitleGenerators)) {
        const patternSegments = routePattern.split('/');
        
        if (patternSegments.length === pathSegments.length) {
          let isMatch = true;
          const params: any = {};
          
          for (let i = 0; i < patternSegments.length; i++) {
            if (patternSegments[i].startsWith('[') && patternSegments[i].endsWith(']')) {
              // This is a parameter, extract it
              const paramName = patternSegments[i].slice(1, -1);
              params[paramName] = pathSegments[i];
            } else if (patternSegments[i] !== pathSegments[i]) {
              isMatch = false;
              break;
            }
          }
          
          if (isMatch) {
            title = generator(params, user);
            break;
          }
        }
      }
      
      // If no dynamic match, try partial matching for nested routes
      if (title === 'El Madrasa - Learn Better') {
        for (const [route, routeTitle] of Object.entries(routeTitles)) {
          if (route !== '/' && pathname.startsWith(route)) {
            title = routeTitle;
            break;
          }
        }
      }
    }

    // Add user role context if available
    if (user?.role && title.includes('El Madrasa')) {
      const roleTitles = {
        student: 'Student',
        teacher: 'Teacher', 
        admin: 'Admin'
      };
      
      // Only add role if it's not already in the title
      if (!title.includes(roleTitles[user.role as keyof typeof roleTitles])) {
        title = title.replace(' - El Madrasa', ` - ${roleTitles[user.role as keyof typeof roleTitles]} - El Madrasa`);
      }
    }

    // Apply translation if available (you can expand this)
    if (language === 'ar') {
      // Arabic translations for common terms
      const arabicTranslations: Record<string, string> = {
        'Dashboard': 'لوحة التحكم',
        'Homework': 'الواجبات',
        'Exams': 'الامتحانات',
        'Results': 'النتائج',
        'Profile': 'الملف الشخصي',
        'Login': 'تسجيل الدخول',
        'Sign Up': 'إنشاء حساب',
        'Management': 'الإدارة',
        'Settings': 'الإعدادات'
      };

      Object.entries(arabicTranslations).forEach(([en, ar]) => {
        title = title.replace(en, ar);
      });
    }

    document.title = title;
    
    // Also update meta description for better SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = getPageDescription(pathname, user);
      document.head.appendChild(newMeta);
    } else {
      metaDescription.setAttribute('content', getPageDescription(pathname, user));
    }

    console.log('📄 Page title updated:', { pathname, title });
  }, [pathname, user, language, segments]);

  return null;
}

// Helper function to generate page descriptions
function getPageDescription(pathname: string, user: any): string {
  const baseDescription = 'El Madrasa - Modern learning platform for students and teachers';
  
  const descriptions: Record<string, string> = {
    '/': 'Join El Madrasa for interactive learning, homework management, and exam preparation. The modern educational platform for students and teachers.',
    '/login': 'Login to your El Madrasa account to access your courses, homework, and exams.',
    '/signup': 'Create your El Madrasa account and start your learning journey today.',
    '/(student)': 'Student dashboard - Manage your courses, homework, and exam schedule.',
    '/(student)/homework': 'View and submit your homework assignments on El Madrasa.',
    '/(student)/exams': 'Check your upcoming exams and view past results.',
    '/(teacher)': 'Teacher dashboard - Manage classes, create assignments, and track student progress.',
    '/(teacher)/my-classes': 'Manage your classes and student enrollments on El Madrasa.',
    '/(teacher)/create-exam': 'Create new exams and assignments for your students.',
    '/(admin)': 'Admin dashboard - Manage users, classes, and system settings.',
  };

  // Exact match
  if (descriptions[pathname]) {
    return descriptions[pathname];
  }

  // Partial matches
  for (const [route, description] of Object.entries(descriptions)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return description;
    }
  }

  return baseDescription;
}

// Alternative simpler version if you don't want to use useSegments
export function SimplePageTitleHandler() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const getTitleForPath = (path: string): string => {
      // Remove query parameters
      const cleanPath = path.split('?')[0];
      
      // Exact matches
      const exactTitles: Record<string, string> = {
        '/': 'El Madrasa - Learn Better',
        '/login': 'Login - El Madrasa',
        '/signup': 'Sign Up - El Madrasa', 
        '/signup-success': 'Sign Up Successful - El Madrasa',
        '/network-error': 'Network Error - El Madrasa',
        '/unauthorized': 'Unauthorized - El Madrasa',
        '/not-found': 'Page Not Found - El Madrasa',
        
        // Student pages
        '/(student)': 'Student Dashboard - El Madrasa',
        '/(student)/homework': 'My Homework - El Madrasa',
        '/(student)/exams': 'My Exams - El Madrasa',
        '/(student)/results': 'My Results - El Madrasa',
        '/(student)/join-subject': 'Join Subject - El Madrasa',
        '/(student)/profile': 'My Profile - El Madrasa',
        
        // Teacher pages  
        '/(teacher)': 'Teacher Dashboard - El Madrasa',
        '/(teacher)/activity': 'Class Activity - El Madrasa',
        '/(teacher)/my-classes': 'My Classes - El Madrasa',
        '/(teacher)/statistics': 'Statistics - El Madrasa',
        '/(teacher)/profile': 'Teacher Profile - El Madrasa',
        '/(teacher)/create-exam': 'Create Exam - El Madrasa',
        '/(teacher)/homework': 'Homework Management - El Madrasa',
        '/(teacher)/homework/create': 'Create Homework - El Madrasa',
        '/(teacher)/exams': 'Exam Management - El Madrasa',
        '/(teacher)/exams/grading': 'Grade Exams - El Madrasa',
        
        // Admin pages
        '/(admin)': 'Admin Dashboard - El Madrasa',
        '/(admin)/users': 'User Management - El Madrasa',
        '/(admin)/students': 'Student Management - El Madrasa',
        '/(admin)/teachers': 'Teacher Management - El Madrasa',
        '/(admin)/classes': 'Class Management - El Madrasa',
        '/(admin)/approvals': 'Pending Approvals - El Madrasa',
        '/(admin)/settings': 'System Settings - El Madrasa',
        '/(admin)/assign-teachers': 'Assign Teachers - El Madrasa',
      };

      // Check exact match first
      if (exactTitles[cleanPath]) {
        return exactTitles[cleanPath];
      }

      // Check for dynamic patterns
      if (cleanPath.match(/\/\(student\)\/homework\/[^/]+/)) {
        return 'Homework Details - El Madrasa';
      }
      if (cleanPath.match(/\/\(student\)\/exam\/[^/]+/)) {
        return 'Take Exam - El Madrasa';
      }
      if (cleanPath.match(/\/\(student\)\/exam\/results\/[^/]+/)) {
        return 'Exam Results - El Madrasa';
      }
      if (cleanPath.match(/\/\(teacher\)\/homework\/[^/]+\/submissions/)) {
        return 'Homework Submissions - El Madrasa';
      }
      if (cleanPath.match(/\/\(teacher\)\/homework\/edit\/[^/]+/)) {
        return 'Edit Homework - El Madrasa';
      }
      if (cleanPath.match(/\/\(teacher\)\/exams\/grading\/[^/]+/)) {
        return 'Grade Exam - El Madrasa';
      }
      if (cleanPath.match(/\/\(teacher\)\/exam-results\/[^/]+/)) {
        return 'Exam Results - El Madrasa';
      }

      // Fallback based on route group
      if (cleanPath.startsWith('/(student)')) {
        return 'Student Portal - El Madrasa';
      }
      if (cleanPath.startsWith('/(teacher)')) {
        return 'Teacher Portal - El Madrasa';
      }
      if (cleanPath.startsWith('/(admin)')) {
        return 'Admin Portal - El Madrasa';
      }
      if (cleanPath.startsWith('/(auth)')) {
        return 'Authentication - El Madrasa';
      }

      return 'El Madrasa - Learn Better';
    };

    const title = getTitleForPath(pathname);
    document.title = title;
    console.log('📄 Page title updated:', { pathname, title });

  }, [pathname, user]);

  return null;
}