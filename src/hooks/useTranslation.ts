// hooks/useTranslation.ts
import { useLanguage } from '../contexts/LanguageContext';

export const useTranslation = () => {
  const { t, language, setLanguage, isRTL, isLoading } = useLanguage();
  
  return {
    t,
    language,
    setLanguage,
    isRTL,
    isLoading,
    // Helper for conditional rendering based on language
    isArabic: language === 'ar',
    isEnglish: language === 'en',
  };
};