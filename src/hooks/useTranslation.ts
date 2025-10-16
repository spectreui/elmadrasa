import { useLanguage } from '../contexts/LanguageContext';

export const useTranslation = () => {
  const { t, language, setLanguage, isRTL } = useLanguage();
  
  return {
    t,
    language,
    setLanguage,
    isRTL,
    // Helper for conditional rendering based on language
    isArabic: language === 'ar',
  };
};
