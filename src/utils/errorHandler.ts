import Alert from "@blazejkustra/react-native-alert";

export class AppError extends Error {
  public code: string;
  public userMessage: string;

  constructor(code: string, message: string, userMessage?: string) {
    super(message);
    this.code = code;
    this.userMessage = userMessage || message;
    this.name = 'AppError';
  }
}

export const handleApiError = (error: any): string => {
  console.error('API Error:', error);

  if (error.code === 'NETWORK_ERROR') {
    return 'Please check your internet connection and try again.';
  }

  if (error.response?.status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to access this resource.';
  }

  if (error.response?.status === 404) {
    return 'The requested resource was not found.';
  }

  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }

  return error.response?.data?.error || error.message || 'An unexpected error occurred.';
};

export const showErrorAlert = (error: any, customMessage?: string) => {
  const message = customMessage || handleApiError(error);
  Alert.alert('Error', message);
};