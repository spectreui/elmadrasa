// app/network-error.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function NetworkErrorScreen() {
  const router = useRouter();

  const handleRetry = () => {
    router.replace('/');
    // You might want to trigger a refresh of your app state here
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📡</Text>
        <Text style={styles.title}>Network Error</Text>
        <Text style={styles.subtitle}>
          Please check your internet connection and try again.
        </Text>
        
        <TouchableOpacity style={styles.button} onPress={handleRetry}>
          <Text style={styles.buttonText}>Retry Connection</Text>
        </TouchableOpacity>
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
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
