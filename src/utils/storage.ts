// src/utils/storage.ts - Simplified version
import AsyncStorage from '@react-native-async-storage/async-storage';

class UniversalStorage {
  private isWeb: boolean;

  constructor() {
    this.isWeb = typeof window !== 'undefined' && !!window.localStorage;
    console.log('📦 Storage initialized:', { isWeb: this.isWeb });
  }

  async getItem(key: string): Promise<string | null> {
    try {
      console.log(`📦 GET "${key}"`);

      if (this.isWeb) {
        const value = localStorage.getItem(key);
        console.log(`📦 GOT "${key}":`, value ? `${value.substring(0, 15)}...` : 'null');
        return value;
      } else {
        const value = await AsyncStorage.getItem(key);
        console.log(`📦 GOT "${key}":`, value ? `${value.substring(0, 15)}...` : 'null');
        return value;
      }
    } catch (error) {
      console.error(`❌ Error getting "${key}":`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      console.log(`💾 SET "${key}":`, value ? `${value.substring(0, 15)}...` : 'empty');

      if (this.isWeb) {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`❌ Error setting "${key}":`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      console.log(`🗑️ REMOVE "${key}"`);

      if (this.isWeb) {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`❌ Error removing "${key}":`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      console.log('🧹 CLEAR ALL');

      if (this.isWeb) {
        localStorage.clear();
      } else {
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  }
}

// Create singleton instance
export const storage = new UniversalStorage();
