// ----------------------
// User Types
// ----------------------
export interface User {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  student_id?: string;
  is_approved: boolean;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  name: string;
  class: string;
  subjects: string[];
}

// ----------------------
// Auth Types
// ----------------------
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// ----------------------
// Exam Types
// ----------------------
export interface ExamSettings {
  timed: boolean;
  duration: number;
  allow_retake?: boolean; // Make optional
  random_order?: boolean; // Make optional
  shuffleQuestions?: boolean;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  class: string;
  teacher_id: string;
  settings: ExamSettings;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    profile: {
      name: string;
      subject?: string;
    };
  };
  questions?: Question[]; // Add questions to Exam type
}

export interface Question {
  id: string;
  exam_id: string;
  question: string;
  type: 'mcq' | 'text';
  options: string[];
  correct_answer: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  profile: {
    name: string;
    subject?: string;
  };
}

export interface StudentStats {
  averageScore: number;
  examsCompleted: number;
  upcomingExams: number;
  totalPoints: number;
}

export interface ExamResult {
  id: string;
  examTitle: string;
  subject: string;
  score: number;
  totalPoints: number;
  percentage: number;
  date: string;
  timeSpent: string;
  correctAnswers: number;
  totalQuestions: number;
}

export interface SubjectPerformance {
  subject: string;
  averageScore: number;
  examsTaken: number;
  trend: 'up' | 'down' | 'stable';
}