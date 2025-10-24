import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocales } from 'expo-localization';
import { useAuth } from './AuthContext';
import { apiService } from '@/services/api';
import ar from '@/locales/ar';
import en from '@/locales/en';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  isLoading: boolean;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations = { ar, en }

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const locales = useLocales();

  // Load language on app start
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        setIsLoading(true);

        let finalLanguage: Language = 'en';

        // Priority: 1. Local storage,  2. User preference from server, 3. Device locale
        if (finalLanguage === 'en') {
          const savedLanguage = await AsyncStorage.getItem('app-language');
          if (savedLanguage) {
            finalLanguage = savedLanguage as Language;
            console.log('📱 Loaded language from local storage:', finalLanguage);
          }
        }

        // If no local preference, check server
        if (isAuthenticated && user) {
          try {
            // Try to get user's language from server
            const userProfile = await apiService.getUserProfile();
            if (userProfile.data?.language) {
              finalLanguage = userProfile.data.language as Language;
              console.log('📱 Loaded language from server:', finalLanguage);
            }
          } catch (error) {
            console.log('Could not fetch language from server, using local storage');
          }
        }

        // If still no preference, use device locale
        if (finalLanguage === 'en' && locales && locales.length > 0) {
          const locale = locales[0];
          finalLanguage = locale.languageCode === 'ar' ? 'ar' : 'en';
          console.log('📱 Loaded language from device:', finalLanguage);
        }

        setLanguageState(finalLanguage);
        setIsRTL(finalLanguage === 'ar');

      } catch (error) {
        console.error('Error loading language:', error);
        setLanguageState('en');
        setIsRTL(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, [isAuthenticated, user, locales]);

  // Sync language to server and local storage
  const setLanguage = async (newLanguage: Language) => {
    try {
      setIsLoading(true);

      // Update local state immediately for responsive UI
      setLanguageState(newLanguage);
      setIsRTL(newLanguage === 'ar');

      // Save to local storage
      await AsyncStorage.setItem('app-language', newLanguage);
      console.log('💾 Saved language to local storage:', newLanguage);

      // Sync to server if user is authenticated
      if (isAuthenticated && user) {
        try {
          await apiService.updateUserLanguage(newLanguage);
          console.log('🌐 Synced language to server:', newLanguage);
        } catch (serverError) {
          console.error('Failed to sync language to server:', serverError);
          // Don't throw error - local change should still work
        }
      }

    } catch (error) {
      console.error('Error setting language:', error);
      // Revert on error
      setLanguageState(language);
      setIsRTL(language === 'ar');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      t,
      isRTL,
      isLoading
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}