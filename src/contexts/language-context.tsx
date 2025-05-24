
"use client";

import type { Dispatch, ReactNode, SetStateAction} from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'pt';

interface LanguageContextType {
  language: Language;
  setLanguage: Dispatch<SetStateAction<Language>>;
  translate: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const translations: Record<Language, Record<string, string>> = {
  en: {},
  pt: {},
};

async function loadTranslations(lang: Language) {
  // Ensure the entry for the language exists and is an object
  if (!translations[lang] || typeof translations[lang] !== 'object') {
    translations[lang] = {};
  }

  // Only load if not already loaded or if it's an empty object (might indicate previous load failure)
  if (Object.keys(translations[lang]).length === 0) {
    try {
      const module = await import(`@/locales/${lang}.json`);
      if (module.default && typeof module.default === 'object' && !Array.isArray(module.default)) {
        translations[lang] = module.default as Record<string, string>;
      } else {
        console.error(`Translations for ${lang} are not in the expected format (must be a plain object). module.default:`, module.default);
        translations[lang] = {}; // Keep as empty object on format error
      }
    } catch (error) {
      console.error(`Could not load translations for ${lang}:`, error);
      translations[lang] = {}; // Ensure it's an empty object on load error

      // Attempt to load English as a fallback if it's not the current language and English isn't loaded/valid
      if (lang !== 'en') {
        if (!translations.en || typeof translations.en !== 'object') {
          translations.en = {};
        }
        if (Object.keys(translations.en).length === 0) {
          try {
            const enModule = await import(`@/locales/en.json`);
            if (enModule.default && typeof enModule.default === 'object' && !Array.isArray(enModule.default)) {
              translations.en = enModule.default as Record<string, string>;
            } else {
              console.error(`Fallback English translations are not in the expected format.`);
               translations.en = {};
            }
          } catch (e) {
            console.error('Could not load fallback English translations:', e);
            translations.en = {};
          }
        }
      }
    }
  }
}


export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('en'); 
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('appLanguage') as Language | null;
    let initialLang: Language = 'en';

    if (storedLang && ['en', 'pt'].includes(storedLang)) {
      initialLang = storedLang;
    } else if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0] as Language;
      if (['en', 'pt'].includes(browserLang)) {
        initialLang = browserLang;
      }
    }
    
    setLanguage(initialLang);
    loadTranslations(initialLang).then(() => {
        setIsInitialized(true);
    });

  }, []);

  useEffect(() => {
    if (language && isInitialized) { 
      localStorage.setItem('appLanguage', language);
      loadTranslations(language); 
    }
  }, [language, isInitialized]);


  const translate = (key: string, replacements: Record<string, string> = {}): string => {
    if (!isInitialized) {
      // console.warn(`LanguageProvider not initialized. Returning key: "${key}"`);
      return key; 
    }

    let langSource = translations[language];

    // Check if primary language translations are valid (object and not empty)
    if (!langSource || typeof langSource !== 'object' || Object.keys(langSource).length === 0) {
        // If primary language is 'en' and it failed, or if fallback to 'en' is needed
        if (language === 'en' || !translations.en || typeof translations.en !== 'object' || Object.keys(translations.en).length === 0) {
            // console.warn(`No valid translations for "${language}" or fallback "en". Returning key: "${key}"`);
            return key; // Ultimate fallback: return key if 'en' is also bad or primary is 'en' and bad
        }
        langSource = translations.en; // Fallback to English
    }
    
    let translation = key; // Default to key
    if (Object.prototype.hasOwnProperty.call(langSource, key) && typeof langSource[key] === 'string') {
      translation = langSource[key];
    } else {
      // console.warn(`Translation key "${key}" not found or not a string for language "${language}". Using key as fallback.`);
    }
    
    Object.keys(replacements).forEach(placeholder => {
      const replacementValue = replacements[placeholder];
      translation = translation.replace(`{{${placeholder}}}`, String(replacementValue ?? ''));
    });
    
    return translation;
  };

  if (!isInitialized) {
    return null; 
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

