// src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen error={this.state.error} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}

interface ErrorScreenProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

function ErrorScreen({ error, errorInfo }: ErrorScreenProps) {
  const router = useRouter();

  const handleRetry = () => {
    router.replace('/');
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Oops! Something went wrong</Text>
        <Text style={styles.subtitle}>We're sorry, but an unexpected error occurred.</Text>
        
        {__DEV__ && error && (
          <View style={styles.errorDetails}>
            <Text style={styles.errorTitle}>Error Details:</Text>
            <Text style={styles.errorText}>{error.toString()}</Text>
            {errorInfo?.componentStack && (
              <Text style={styles.stackText}>{errorInfo.componentStack}</Text>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
            <Text style={styles.secondaryButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  stackText: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
});
