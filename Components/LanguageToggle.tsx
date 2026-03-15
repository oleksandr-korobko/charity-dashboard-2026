import React from "react";
import { useLanguage } from "../src/contexts/LanguageContext";
import { Languages } from "lucide-react";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ua' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 shadow-sm"
      title={language === 'en' ? 'Переключити на українську' : 'Switch to English'}
    >
      <Languages className="h-4 w-4" />
      <span className="font-semibold">
        {language === 'en' ? 'EN' : 'UA'}
      </span>
      <span className="text-xs text-gray-500">
        {language === 'en' ? '🇺🇸' : '🇺🇦'}
      </span>
    </button>
  );
} 