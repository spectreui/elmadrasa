// src/utils/storage.ts - Enhanced version
class UniversalStorage {
  private isWeb: boolean;
  private initialized: boolean = false;
  private asyncStorageModule: any = null;

  constructor() {
    this.isWeb = typeof window !== 'undefined' && !!window.localStorage;
    console.log('📦 Storage initialized:', { isWeb: this.isWeb, initialized: this.initialized });
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      if (!this.isWeb) {
        // Lazy load AsyncStorage
        if (!this.asyncStorageModule) {
          this.asyncStorageModule = await import('@react-native-async-storage/async-storage');
        }
        // Test connection
        await this.asyncStorageModule.default.getItem('test_connection');
      }
      this.initialized = true;
      console.log('✅ Storage fully initialized');
    } catch (error) {
      console.warn('⚠️ Storage initialization warning:', error);
      // Don't throw error, just mark as initialized to prevent blocking
      this.initialized = true;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      await this.ensureInitialized();
      console.log(`📦 GET "${key}"`);

      if (this.isWeb) {
        const value = localStorage.getItem(key);
        return value;
      } else {
        if (!this.asyncStorageModule) {
          this.asyncStorageModule = await import('@react-native-async-storage/async-storage');
        }
        const value = await this.asyncStorageModule.default.getItem(key);
        return value;
      }
    } catch (error) {
      console.error(`❌ Error getting "${key}":`, error);
      // Return null instead of throwing to prevent app crashes
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
        if (!this.asyncStorageModule) {
          this.asyncStorageModule = await import('@react-native-async-storage/async-storage');
        }
        await this.asyncStorageModule.default.setItem(key, value);
      }
      
      // Verify write (optional)
      const stored = await this.getItem(key);
      if (stored !== value) {
        console.warn(`⚠️ SET verification mismatch for "${key}"`);
      }
    } catch (error) {
      console.error(`❌ Error setting "${key}":`, error);
      // Don't throw error to prevent app crashes
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log(`🗑️ REMOVE "${key}"`);

      if (this.isWeb) {
        localStorage.removeItem(key);
      } else {
        if (!this.asyncStorageModule) {
          this.asyncStorageModule = await import('@react-native-async-storage/async-storage');
        }
        await this.asyncStorageModule.default.removeItem(key);
      }

      // Verify removal (optional)
      const stored = await this.getItem(key);
      if (stored !== null) {
        console.warn(`⚠️ REMOVE verification failed for "${key}"`);
      }
    } catch (error) {
      console.error(`❌ Error removing "${key}":`, error);
      // Don't throw error to prevent app crashes
    }
  }

  async clear(): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log('🧹 CLEAR ALL');

      if (this.isWeb) {
        localStorage.clear();
      } else {
        if (!this.asyncStorageModule) {
          this.asyncStorageModule = await import('@react-native-async-storage/async-storage');
        }
        await this.asyncStorageModule.default.clear();
      }
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
      // Don't throw error to prevent app crashes
    }
  }

  // Emergency reset function
  async emergencyReset(): Promise<void> {
    try {
      console.log('🚨 EMERGENCY STORAGE RESET');
      if (this.isWeb) {
        localStorage.clear();
      } else {
        if (!this.asyncStorageModule) {
          this.asyncStorageModule = await import('@react-native-async-storage/async-storage');
        }
        await this.asyncStorageModule.default.clear();
      }
      this.initialized = false;
      console.log('✅ Emergency reset completed');
    } catch (error) {
      console.error('❌ Emergency reset failed:', error);
    }
  }
}

// Create singleton instance
export const storage = new UniversalStorage();
