// src/utils/cache.ts - Enhanced caching with proper error handling
import { storage } from './storage';

// Cache keys for different data types
const CACHE_KEYS = {
  // Student cache keys
  DASHBOARD: 'student_dashboard',
  EXAMS: 'student_exams',
  HOMEWORK: 'student_homework',
  PROFILE: 'user_profile',
  STATS: 'student_stats',
  
  // Teacher cache keys
  TEACHER_DASHBOARD: 'teacher_dashboard',
  TEACHER_CLASSES: 'teacher_classes',
  TEACHER_ACTIVITY: 'teacher_activity',
  TEACHER_STATS: 'teacher_stats',
  TEACHER_HOMEWORK: 'teacher_homework',
  TEACHER_PROFILE: 'teacher_profile',
  TEACHER_CLASS_STATS: 'teacher_class_stats', // for statistics page
};

// Save data to cache with timestamp
export const saveToCache = async (key: string, data: any) => {
  try {
    const payload = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    await storage.setItem(key, JSON.stringify(payload));
    console.log(`✅ Cached data for ${key}`);
  } catch (error) {
    console.error(`❌ Failed to cache ${key}:`, error);
  }
};

// Get data from cache with expiration check (24 hours default)
export const getFromCache = async (key: string, maxAgeHours = 24) => {
  try {
    const cached = await storage.getItem(key);
    if (!cached) return null;
    
    const payload = JSON.parse(cached);
    const ageHours = (Date.now() - payload.timestamp) / (1000 * 60 * 60);
    
    if (ageHours > maxAgeHours) {
      console.log(`⏰ Cache expired for ${key}`);
      await storage.removeItem(key);
      return null;
    }
    
    return payload.data;
  } catch (error) {
    console.error(`❌ Failed to read cache ${key}:`, error);
    return null;
  }
};

// Clear all cache
export const clearCache = async () => {
  try {
    Object.values(CACHE_KEYS).forEach(async (key) => {
      await storage.removeItem(key);
    });
    console.log('🗑️ Cache cleared');
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
};

// Clear specific cache entries
export const clearCacheEntries = async (keys: string[]) => {
  try {
    for (const key of keys) {
      await storage.removeItem(key);
    }
    console.log(`🗑️ Cleared cache entries: ${keys.join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to clear cache entries:', error);
  }
};

export { CACHE_KEYS };
