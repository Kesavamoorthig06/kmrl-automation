import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // 'en' for English, 'ml' for Malayalam, 'hi' for Hindi

  const switchLanguage = () => {
    setLanguage(prev => {
      if (prev === 'en') return 'ml';
      if (prev === 'ml') return 'hi';
      return 'en';
    });
  };

  const setLanguageDirect = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, switchLanguage, setLanguageDirect }}>
      {children}
    </LanguageContext.Provider>
  );
};
