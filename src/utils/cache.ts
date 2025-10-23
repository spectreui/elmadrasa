// src/utils/cache.ts
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
  TEACHER_PROFILE: 'teacher_homework',
  TEACHER_CLASS_STATS: 'teacher_class_stats', // for statistics page
};

// Save data to cache
export const saveToCache = async (key: string, data: any) => {
  try {
    await storage.setItem(key, JSON.stringify(data));
    console.log(`✅ Cached data for ${key}`);
  } catch (error) {
    console.error(`❌ Failed to cache ${key}:`, error);
  }
};

// Get data from cache
export const getFromCache = async (key: string) => {
  try {
    const cached = await storage.getItem(key);
    return cached ? JSON.parse(cached) : null;
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

export { CACHE_KEYS };
