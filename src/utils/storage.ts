// src/utils/storage.ts
class UniversalStorage {
  private isWeb: boolean;
  private initialized: boolean = false;

  constructor() {
    this.isWeb = typeof window !== 'undefined' && !!window.localStorage;
    console.log('📦 Storage initialized:', { isWeb: this.isWeb, initialized: this.initialized });
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      if (!this.isWeb) {
        // Test AsyncStorage in React Native
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.getItem('test');
      }
      this.initialized = true;
      console.log('✅ Storage fully initialized');
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      await this.ensureInitialized();
      console.log(`📦 GET "${key}"`);

      if (this.isWeb) {
        return localStorage.getItem(key);
      } else {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        return await AsyncStorage.default.getItem(key);
      }
    } catch (error) {
      console.error(`❌ Error getting "${key}":`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log(`💾 SET "${key}":`, value ? `${value.substring(0, 15)}...` : 'empty');

      if (this.isWeb) {
        localStorage.setItem(key, value);
      } else {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.setItem(key, value);
      }
      
      // Verify write
      const stored = await this.getItem(key);
      console.log(`✅ SET verified:`, stored ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.error(`❌ Error setting "${key}":`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log(`🗑️ REMOVE "${key}"`);

      if (this.isWeb) {
        localStorage.removeItem(key);
      } else {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.removeItem(key);
      }

      // Verify removal
      const stored = await this.getItem(key);
      console.log(`✅ REMOVE verified:`, stored ? 'FAILED' : 'SUCCESS');
    } catch (error) {
      console.error(`❌ Error removing "${key}":`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log('🧹 CLEAR ALL');

      if (this.isWeb) {
        localStorage.clear();
      } else {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.clear();
      }
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const storage = new UniversalStorage();