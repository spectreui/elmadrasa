// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { LoginRequest, AuthResponse, ApiResponse, User, Exam } from "../types";
import { storage } from "../utils/storage";

// const API_BASE_URL = "http://192.168.1.224:5001/api";
const API_BASE_URL = "https://elmadrasa-server.vercel.app/api";

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;
  private tokenKey = 'authToken';

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
      timeoutErrorMessage: "Request timeout - server not responding"
    });

    this.initializeToken();
    this.setupInterceptors();
  }

  private async initializeToken(): Promise<void> {
    try {
      this.token = await storage.getItem(this.tokenKey);
      console.log('🔑 Initialized token from storage:', this.token ? `${this.token.substring(0, 15)}...` : 'none');

      if (this.token) {
        // Validate token before using
        const isValid = await this.validateToken();
        if (isValid) {
          this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
          console.log('✅ Token validated and set in headers');
        } else {
          console.log('❌ Token invalid, cleared from storage');
          this.token = null;
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize token:', error);
      this.token = null;
    }
  }

  private setupInterceptors(): void {
    // Request interceptor - ensure token is fresh
    this.api.interceptors.request.use(
      async (config) => {
        // Ensure we have the latest token
        if (!this.token) {
          await this.initializeToken();
        }

        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          hasToken: !!this.token,
          tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : 'none'
        });

        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Enhanced response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data?.success ? 'success' : 'error'
        });
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        console.error('❌ API Error:', {
          status: error.response?.status,
          url: originalRequest?.url,
          message: error.response?.data?.error || error.message,
          code: error.code
        });

        if (error.response?.status === 401) {
          console.log('🔐 Unauthorized - clearing token and redirecting');
          await this.clearToken();

          // If we have a token but got 401, it might be expired
          if (this.token && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log('🔄 Retrying request with fresh token');
            await this.initializeToken(); // Re-initialize token
            return this.api(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Enhanced Token management
  async validateToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const tokenParts = this.token.split('.');
      if (tokenParts.length !== 3) {
        console.log('❌ Invalid token structure');
        await this.clearToken();
        return false;
      }

      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiry = payload.exp * 1000;
        if (Date.now() >= expiry) {
          console.log('❌ Token expired');
          await this.clearToken();
          return false;
        }
        console.log('✅ Token valid, expires:', new Date(expiry).toISOString());
        return true;
      } catch (e) {
        console.log('❌ Token payload invalid');
        await this.clearToken();
        return false;
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      await this.clearToken();
      return false;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      this.token = token;
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await storage.setItem(this.tokenKey, token);

      // Verify storage
      const storedToken = await storage.getItem(this.tokenKey);
      console.log('✅ Token set and stored:', {
        set: token.substring(0, 20) + '...',
        stored: storedToken ? storedToken.substring(0, 20) + '...' : 'none',
        match: storedToken === token
      });
    } catch (error) {
      console.error('❌ Failed to set token:', error);
      throw error;
    }
  }

  async clearToken(): Promise<void> {
    try {
      this.token = null;
      delete this.api.defaults.headers.common['Authorization'];
      await storage.removeItem(this.tokenKey);

      // Verify clearance
      const storedToken = await storage.getItem(this.tokenKey);
      console.log('✅ Token cleared verification:', {
        storedToken: storedToken ? 'still exists' : 'cleared'
      });
    } catch (error) {
      console.error('❌ Failed to clear token:', error);
      throw error;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get("/health");
      return response.data.success === true;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> {
    // Clear any existing token first
    await this.clearToken();

    const response = await this.api.post("/auth/login", credentials);

    if (response.data.success && response.data.data?.token) {
      await this.setToken(response.data.data.token);

      // Verify token was set
      const verifiedToken = await storage.getItem(this.tokenKey);
      console.log('✅ Token verification:', {
        set: !!response.data.data.token,
        stored: !!verifiedToken,
        match: response.data.data.token === verifiedToken
      });
    }

    return response;
  }

  // Student methods
  async getStudentDashboard(): Promise<AxiosResponse<ApiResponse<any>>> {
    console.log('📊 Fetching dashboard data...');
    return this.api.get("/students/dashboard");
  }

  async getExams() {
    return this.api.get('/students/exams');
  }

  async getUpcomingExams() {
    return this.api.get('/students/upcoming-exams');
  }

  async checkExamTaken(examId: string) {
    try {
      const response = await this.api.get(`/students/exam/${examId}/status`);
      return response.data.data?.taken || false;
    } catch (error) {
      return false;
    }
  }

  // Teacher methods


  public async getCurrentUser(): Promise<AxiosResponse<ApiResponse<User>>> {
    return this.api.get("/auth/me");
  }

  // Student methods
  public async getStudentStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/students/stats");
  }

  public async getStudentResults(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/students/results");
  }

  public async getSubjectPerformance(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/students/subject-performance");
  }

  public async getExamById(id: string): Promise<AxiosResponse<ApiResponse<Exam>>> {
    return this.api.get(`/exams/${id}`);
  }

  // Teacher methods
  public async getTeacherStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/stats");
  }

  public async getRecentActivity(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/activity");
  }

  public async getTeacherClasses(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/classes");
  }

  public async createHomework(homeworkData: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/homework", homeworkData);
  }

  public async getExamResults(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/exams/${examId}/results`);
  }

  public async getExamSubmissions(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/exams/${examId}/submissions`);
  }

  public async gradeSubmission(submissionId: string, grade: number, feedback?: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post(`/submissions/${submissionId}/grade`, { grade, feedback });
  }

  async getStudentDashboardStats() {
    return this.api.get('/students/dashboard');
  }

  public async getTeacherProfileStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/profile/stats");
  }

  public async updateTeacherProfile(profileData: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put("/teachers/profile", profileData);
  }

  public async getTeacherAchievements(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/achievements");
  }

  public async getTeacherDashboardStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/stats");
  }


  public async getTeacherClassesWithStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/classes/stats");
  }

  public async getExamStatistics(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/exams/${examId}/statistics`);
  }

  public async getTeacherStatistics(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/statistics");
  }

  // In your apiService.ts - Add this method
  async getTeacherExams(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/exams"); // Or whatever your teacher exams endpoint is
  }

  async getTeacherExamResults(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/teachers/exams/${examId}/results`);
  }

  public async getRecentTeacherActivity(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/activity");
  }

  public async getHomework(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/homework");
  }

  public async getHomeworkById(id: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/homework/${id}`);
  }

  public async submitHomework(submission: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/homework/submit", submission);
  }

  public async deleteExam(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.delete(`/exams/${examId}`);
  }

  public async updateExam(examId: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put(`/exams/${examId}`, data);
  }

  public async createExam(examData: any): Promise<AxiosResponse<ApiResponse<Exam>>> {
    return this.api.post("/exams", examData);
  }

  public async submitExam(submission: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/submissions/submit", submission);
  }


  async submitExamAnswers(examId: string, answers: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post('/submissions/submit', { // ✅ Changed endpoint
      examId: examId,
      answers: answers
    });
  }

  async getSubmissionResults(submissionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/submissions/${submissionId}/results`);
  }

  async getLatestSubmission(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/submissions/exam/${examId}/latest`);
  }

  async getStudentSubmissions(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get('/submissions/student/all');
  }
}

export const apiService = new ApiService();