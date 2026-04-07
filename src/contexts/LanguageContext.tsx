import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ua';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation strings
const translations = {
  en: {
    'dashboard.title': 'Financial Report 2026',
    'dashboard.subtitle': 'Donations and Support Flow for Ukrainian Yogis',
    'dashboard.year': '2026',
    'summary.totalIncome': 'Total Income',
    'summary.totalExpenses': 'Total Expenses',
    'summary.balance': 'Balance',
    'summary.numberOfTransactions': 'Number of Transactions',
    'summary.incomeUSD': 'Income USD',
    'summary.incomeEUR': 'Income EUR',
    'summary.expensesUSD': 'Expenses USD',
    'summary.expensesEUR': 'Expenses EUR',
    'charts.incomeVsExpenses': 'Income vs Expenses',
    'charts.incomeBySource': 'Income by Source',
    'charts.expensesByCategory': 'Expenses by Category',
    'charts.financialDynamics': 'Financial Dynamics Over Time',
    'charts.dynamicsSubtitle': 'From {startDate} to {endDate}',
    'charts.monthlyBreakdown': 'Monthly Breakdown',
    'table.transactionsTitle': 'Transaction List',
    'table.incomeRecords': 'Income Records',
    'table.expenseRecords': 'Expense Records',
    'table.type': 'Type',
    'table.date': 'Date',
    'table.amountUSD': 'Amount USD',
    'table.amountEUR': 'Amount EUR',
    'table.category': 'Category',
    'table.source': 'Source',
    'table.searchPlaceholder': 'Search...',
    'table.percentage': '%',
    'table.scrollHint': 'Scroll horizontally',
    'type.income': 'Paid in',
    'type.expense': 'Paid out',
    'source.paypal': 'PayPal',
    'source.iban': 'IBAN Transfer',
    'currency.usd': 'USD',
    'currency.eur': 'EUR',
    'language.switchTo': 'Switch to Ukrainian',
    'language.current': 'English',
    'filters.dateRange': 'Date Range',
    'filters.currency': 'Currency',
    'filters.type': 'Transaction Type',
    'filters.all': 'All',
  },
  ua: {
    'dashboard.title': 'Фінансовий звіт 2026',
    'dashboard.subtitle': 'Надходження та витрати на підтримку українських йогів',
    'dashboard.year': '2026',
    'summary.totalIncome': 'Загальні надходження',
    'summary.totalExpenses': 'Загальні витрати',
    'summary.balance': 'Баланс',
    'summary.numberOfTransactions': 'Кількість транзакцій',
    'summary.incomeUSD': 'Надходження USD',
    'summary.incomeEUR': 'Надходження EUR',
    'summary.expensesUSD': 'Витрати USD',
    'summary.expensesEUR': 'Витрати EUR',
    'charts.incomeVsExpenses': 'Надходження vs Витрати',
    'charts.incomeBySource': 'Надходження за джерелами',
    'charts.expensesByCategory': 'Витрати за категоріями',
    'charts.financialDynamics': 'Фінансова динаміка у часі',
    'charts.dynamicsSubtitle': 'Період: {startDate} — {endDate}',
    'charts.monthlyBreakdown': 'Помісячна розбивка',
    'table.transactionsTitle': 'Список транзакцій',
    'table.incomeRecords': 'Записи надходжень',
    'table.expenseRecords': 'Записи витрат',
    'table.type': 'Тип',
    'table.date': 'Дата',
    'table.amountUSD': 'Сума USD',
    'table.amountEUR': 'Сума EUR',
    'table.category': 'Категорія',
    'table.source': 'Джерело',
    'table.searchPlaceholder': 'Пошук...',
    'table.percentage': '%',
    'table.scrollHint': 'Гортайте горизонтально',
    'type.income': 'Надходження',
    'type.expense': 'Витрата',
    'source.paypal': 'PayPal',
    'source.iban': 'IBAN переказ',
    'currency.usd': 'USD',
    'currency.eur': 'EUR',
    'language.switchTo': 'Перемкнути на англійську',
    'language.current': 'Українська',
    'filters.dateRange': 'Діапазон дат',
    'filters.currency': 'Валюта',
    'filters.type': 'Тип транзакції',
    'filters.all': 'Всі',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('appLanguage');
      if (savedLang === 'en' || savedLang === 'ua') {
        return savedLang as Language;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', lang);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 