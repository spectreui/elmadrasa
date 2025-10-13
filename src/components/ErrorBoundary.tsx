// src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    router.replace('/(auth)/login');
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 justify-center items-center bg-white p-6">
          <Text className="text-xl font-bold text-red-600 mb-4">Something went wrong</Text>
          <Text className="text-gray-600 text-center mb-6">
            We're sorry, but something went wrong. Please try logging in again.
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            className="bg-blue-600 rounded-lg py-3 px-6"
          >
            <Text className="text-white font-medium">Go to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
