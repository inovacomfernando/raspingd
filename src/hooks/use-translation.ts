
"use client";

import { useLanguage } from '@/contexts/language-context';

export const useTranslation = () => {
  const { translate, language, setLanguage } = useLanguage();
  return { t: translate, currentLanguage: language, setLanguage };
};
