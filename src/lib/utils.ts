import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

// Function to translate city names bidirectionally (UA ↔ EN)
export function translateCityName(cityName: string, language: 'en' | 'ua' = 'en'): string {
  // Trim whitespace and check for empty/invalid values
  const trimmedCity = (cityName || '').trim();

  if (!trimmedCity || trimmedCity.startsWith("€") || trimmedCity.includes("\"")) {
    return language === 'en' ? "Unknown" : "Невідомо";
  }

  // Bidirectional city name mapping (Ukrainian → English)
  const cityTranslationsUAtoEN: Record<string, string> = {
    "Біла Церква": "Bila Tserkva",
    "Вінниця": "Vinnytsia",
    "Вознесенськ": "Voznesensk",
    "Глеваха": "Glevakha",
    "Дніпро": "Dnipro",
    "Запоріжжя": "Zaporizhzhia",
    "Івано-Франківськ": "Ivano-Frankivsk",
    "Київ": "Kyiv",
    "Кропивницький": "Kropyvnytskyi",
    "Львів": "Lviv",
    "Маріуполь": "Mariupol",
    "Миколаїв": "Mykolaiv",
    "Одеса": "Odesa",
    "Полтава": "Poltava",
    "Рівне": "Rivne",
    "Суми": "Sumy",
    "Тернопіль": "Ternopil",
    "Ужгород": "Uzhhorod",
    "Харків": "Kharkiv",
    "Херсон": "Kherson",
    "Хмельницький": "Khmelnytskyi",
    "Черкаси": "Cherkasy",
    "Чернівці": "Chernivtsi",
    "Чернігів": "Chernihiv",
    "Бердянськ": "Berdiansk",
    "Бровари": "Brovary",
    "Васильків": "Vasylkiv",
    "Ірпінь": "Irpin",
    "Кам'янське": "Kamianske",
    "Краматорськ": "Kramatorsk",
    "Кременчук": "Kremenchuk",
    "Ладижин": "Ladyzhyn",
    "Лубни": "Lubny",
    "Лисичанськ": "Lysychansk",
    "Мелітополь": "Melitopol",
    "Нікополь": "Nikopol",
    "Новомосковськ": "Novomoskovsk",
    "Павлоград": "Pavlohrad",
    "Сєвєродонецьк": "Severodonetsk",
    "Слов'янськ": "Sloviansk",
    "Смела": "Smila",
    "Стрий": "Stryi",
    "Умань": "Uman",
    "Фастів": "Fastiv",
    "Южне": "Yuzhne",
    "Добропілля": "Dobropillia",
    "Житомир": "Zhytomyr",
    "Іршанск Житомирська обл.": "Irshansk, Zhytomyr Oblast",
    "Косів": "Kosiv",
    "Ніжин": "Nizhyn",
    "Нovovолинськ": "Novovolynsk",
    "Очаків": "Ochakiv",
    "Пирятин": "Pyryatyn",
    "Полт обл": "Poltava Oblast",
    "с.Сиволож": "Syvolozh village",
    "с.Солений Ліман, Дніпропетровська обл": "Solenyy Lyman village, Dnipropetrovsk Oblast",
    "с.Ставок": "Stavok village",
    "Славянськ": "Sloviansk",
    "Снідавка": "Snidavka",
    "Українка": "Ukrainka",
    "Южноукраїнськ": "Yuzhnoukrainsk",
    "Південноукраїнськ": "Yuzhnoukrainsk",
    "с. Рожни Київської області": "Rozhny village, Kyiv Oblast",
    "Київська обл": "Kyiv Oblast",
    "Київ/Нова Каховка": "Kyiv/Nova Kakhovka",
    "Кривий Ріг": "Kryvyi Rih",
    "Жовті Води": "Zhovti Vody",
    "Польща": "Poland"
  };

  // Create reverse mapping (English → Ukrainian)
  const cityTranslationsENtoUA: Record<string, string> = {};
  Object.entries(cityTranslationsUAtoEN).forEach(([ua, en]) => {
    cityTranslationsENtoUA[en] = ua;
  });

  if (language === 'en') {
    // Translate UA → EN, or keep as-is if already in English
    return cityTranslationsUAtoEN[trimmedCity] || trimmedCity;
  } else {
    // Translate EN → UA, or keep as-is if already in Ukrainian
    return cityTranslationsENtoUA[trimmedCity] || trimmedCity;
  }
}

// Category translation system
export interface CategoryTranslations {
  [key: string]: string;
}

const categoryTranslationsUA: CategoryTranslations = {
  "Early War Aid": "Допомога у перші дні війни",
  "Basic Needs Support": "Допомога через нестачу засобів",
  "Medical Aid": "Медична допомога", 
  "Housing Assistance": "Допомога з житлом",
  "Protective Equipment": "Захисне спорядження",
  "Document Restoration": "Відновлення документів",
  "Military Family Support": "Підтримка родини військового",
  "Military Support": "Підтримка військових",
  "Housing Loss": "Втрата житла",
  "Other": "Інше"
};

const categoryTranslationsEN: CategoryTranslations = {
  "Допомога у перші дні війни": "Early War Aid",
  "Гуманітарна допомога на початку": "Early War Aid",
  "Допомога через нестачу засобів для існування": "Basic Needs Support",
  "Допомога через нестачу засобів": "Basic Needs Support", 
  "На лікування": "Medical Aid",
  "Медична допомога": "Medical Aid",
  "На пошкоджене житло": "Housing Assistance", 
  "Допомога з житлом": "Housing Assistance",
  "Втрата житла": "Housing Loss",
  "На військове спорядження для сина": "Protective Equipment",
  "На військове спорядження": "Protective Equipment",
  "Військове спорядження": "Protective Equipment",
  "Захисне спорядження": "Protective Equipment",
  "На захисне спорядження для сина": "Protective Equipment",
  "Допомога на відновлення документів": "Document Restoration",
  "Відновлення документів": "Document Restoration",
  "Для родини військового": "Military Family Support",
  "Підтримка родини військового": "Military Family Support",
  "На військове авто для чоловіка": "Military Support",
  "Підтримка військових": "Military Support",
  "Підтримка базових потреб": "Basic Needs Support",
  "Інше": "Other",
  "": "Other"
};

// Function to clean up and standardize category names with translation
export function cleanAndTranslateCategoryName(category: string, toLanguage: 'en' | 'ua' = 'en'): string {
  if (!category || category.trim() === "" || category === "035\"" || category === "035") {
    return toLanguage === 'en' ? "Other" : "Інше";
  }

  const cleaned = category.trim();
  
  // First, normalize the Ukrainian categories to standard forms
  let normalizedCategory = "";
  
  if (cleaned === "Допомога у перші дні війни" || 
      cleaned === "Гуманітарна допомога на початку" ||
      cleaned.includes("Допомога у перші дні війни")) {
    normalizedCategory = "Допомога у перші дні війни";
  } else if (cleaned === "На захисне спорядження для сина" ||
      cleaned.includes("На захисне спорядження") ||
      cleaned.includes("захисне спорядження") ||
      cleaned.includes("військове спорядження")) {
    normalizedCategory = "Захисне спорядження";
  } else if (cleaned === "Допомога через нестачу засобів для існування" ||
      cleaned.includes("нестачу засобів") ||
      cleaned === "Підтримка базових потреб") {
    normalizedCategory = "Допомога через нестачу засобів";
  } else if (cleaned === "На лікування" ||
      cleaned.includes("лікування")) {
    normalizedCategory = "Медична допомога";
  } else if (cleaned === "Допомога на відновлення документів" ||
      cleaned.includes("відновлення документів")) {
    normalizedCategory = "Відновлення документів";
  } else if (cleaned === "На пошкоджене житло" ||
      cleaned.includes("пошкоджене житло") ||
      cleaned === "Втрата житла") {
    normalizedCategory = "Втрата житла";
  } else if (cleaned.includes("Для родини військового") ||
      cleaned.includes("Підтримка родини військового")) {
    normalizedCategory = "Підтримка родини військового";
  } else if (cleaned.includes("На військове авто") ||
      cleaned === "Підтримка військових") {
    normalizedCategory = "Підтримка військових";
  } else {
    normalizedCategory = "Інше";
  }
  
  // Then translate to target language
  if (toLanguage === 'en') {
    return categoryTranslationsEN[normalizedCategory] || categoryTranslationsEN[cleaned] || "Other";
  } else {
    return normalizedCategory;
  }
} 