import axios, { AxiosInstance, AxiosResponse } from "axios";
import { LoginRequest, AuthResponse, ApiResponse, User, Exam } from "../types";

const API_BASE_URL = "http://192.168.1.69:5001/api";

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  public async login(credentials: LoginRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> {
    return this.api.post("/auth/login", credentials);
  }

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

  // Exam methods
  public async getExams(): Promise<AxiosResponse<ApiResponse<Exam[]>>> {
    return this.api.get("/exams");
  }

  public async getExamById(id: string): Promise<AxiosResponse<ApiResponse<Exam>>> {
    return this.api.get(`/exams/${id}`);
  }

  public async createExam(examData: any): Promise<AxiosResponse<ApiResponse<Exam>>> {
    return this.api.post("/exams", examData);
  }

  public async submitExam(submission: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/exams/submit", submission);
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

  public async getExamSubmissions(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/exams/${examId}/submissions`);
  }

  public async deleteExam(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.delete(`/exams/${examId}`);
  }

  public async updateExam(examId: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put(`/exams/${examId}`, data);
  }

  // Token management
  public setToken(token: string): void {
    this.token = token;
    this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  public clearToken(): void {
    this.token = null;
    delete this.api.defaults.headers.common["Authorization"];
  }

  public getToken(): string | null {
    return this.token;
  }

  // Health check
  public async testConnection(): Promise<boolean> {
    try {
      await this.api.get("/health");
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const apiService = new ApiService();