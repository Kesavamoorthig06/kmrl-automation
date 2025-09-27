import { useLanguage } from '../contexts/LanguageContext';
import { en } from '../translations/en';
import { ml } from '../translations/ml';
import { hi } from '../translations/hi';

const translations = {
  en,
  ml,
  hi
};

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key, params = {}) => {
    let translation = translations[language][key] || key;
    
    // Replace parameters in translation
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });
    
    return translation;
  };
  
  return { t, language };
};
