import React, { useState, useRef, useEffect } from "react";
import SummaryCards from "./Components/SummaryCards";
import IncomeCurrencyPieChart from "./Components/IncomeCurrencyPieChart";
import ExpenseSummaryCard from "./Components/ExpenseSummaryCard";
import TransactionsTable from "./Components/TransactionsTable";
import LanguageToggle from "./Components/LanguageToggle";
import { LanguageProvider, useLanguage } from "./src/contexts/LanguageContext";
import { AnimatedSection } from "./src/components/ui/AnimatedSection";
import { FileText, RefreshCw } from "lucide-react";
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { FinancialData } from "./src/types/financial";

// Auto-refresh interval (1 hour)
const POLLING_INTERVAL = 3600000; // 1 hour = 60 * 60 * 1000

// Empty initial data
const emptyData: FinancialData = {
  income: [],
  expenses: [],
  summary: {
    totalIncomeUSD: 0,
    totalIncomeEUR: 0,
    totalExpensesUSD: 0,
    totalExpensesEUR: 0,
    balanceUSD: 0,
    balanceEUR: 0,
    lastUpdated: new Date().toISOString()
  }
};

function DashboardContent() {
  const { t, language } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<FinancialData>(emptyData);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Cooldown for Refresh button (10 seconds)
  const REFRESH_COOLDOWN = 10000;

  const allRecords = [...data.income, ...data.expenses];

  // Check if refresh button is in cooldown
  const isRefreshDisabled = isRefreshing || (Date.now() - lastRefreshTime < REFRESH_COOLDOWN);

  // Auto-refresh data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch from /api/data (works in both dev and production)
        const response = await fetch('/api/data');
        if (response.ok) {
          const newData = await response.json();

          // Only update if data has actually changed
          if (newData.summary.lastUpdated !== lastUpdated) {
            console.log('📊 Data updated:', newData.summary.lastUpdated);
            setData(newData);
            setLastUpdated(newData.summary.lastUpdated);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setIsLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchData();

    // Set up polling interval
    const intervalId = setInterval(fetchData, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  const handleRefreshData = async () => {
    // Check cooldown - prevent spam
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;

    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      const remainingTime = Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh) / 1000);
      console.log(`⏳ Please wait ${remainingTime} seconds before refreshing again`);
      return;
    }

    setIsRefreshing(true);
    setLastRefreshTime(now);

    try {
      // Add ?force=true to bypass cache and get fresh data
      const response = await fetch('/api/data?force=true');
      if (response.ok) {
        const newData = await response.json();
        setData(newData);
        setLastUpdated(newData.summary.lastUpdated);
        console.log('✅ Data refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to refresh data', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePdfExport = async () => {
    if (!dashboardRef.current) return;

    setIsExporting(true);

    // Auto-scroll to bottom to trigger animations/lazy loading
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        useCORS: true,
        logging: false,
        height: element.scrollHeight,
        ignoreElements: (element: Element) => {
          return element.id === 'transactions-table-section';
        }
      } as any);

      const imgData = canvas.toDataURL('image/png');

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`financial_report_2026_${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };


  const renderTitle = () => {
    if (language === 'ua') {
      return (
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Фінансовий звіт <span className="text-blue-600">2026</span>
        </h1>
      );
    }
    return (
       <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
         Financial Report <span className="text-blue-600">2026</span>
       </h1>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col font-sans text-gray-900" ref={dashboardRef}>
      <header className="bg-white border-b fixed top-0 left-0 right-0 z-50 shadow-md" data-html2canvas-ignore>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <a
                href="https://ukrainian-yogis-aid-dashboard.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-blue-600 transition font-medium"
              >
                {language === 'ua' ? 'Попередні роки' : 'Previous Years'}
              </a>

              <div className="flex flex-wrap items-center gap-3 justify-end">
                <button
                  onClick={handleRefreshData}
                  disabled={isRefreshDisabled}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isRefreshing ? "Refreshing..." : "Refresh data from Google Sheets (max once per 10 seconds)"}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handlePdfExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium shadow-sm disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  {isExporting ? 'Generating...' : 'Export PDF'}
                </button>
                <LanguageToggle />
              </div>
           </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 md:pt-28 pb-6 text-center">
          {renderTitle()}
          <p className="text-lg text-gray-600 mt-3">
            {t('dashboard.subtitle')}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {dayjs(lastUpdated).format('DD MMMM YYYY, HH:mm')}
          </p>
          {isExporting && (
             <p className="text-xs text-gray-400 mt-1">Generated on {dayjs().format('DD MMM YYYY')}</p>
          )}
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-w-0">

        <AnimatedSection forceVisible={isExporting}>
          <SummaryCards
            summary={data.summary}
            totalTransactions={data.expenses.length}
          />
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
          <AnimatedSection delay={0.1} forceVisible={isExporting}>
            <IncomeCurrencyPieChart
              totalUSD={data.summary.totalIncomeUSD}
              totalEUR={data.summary.totalIncomeEUR}
            />
          </AnimatedSection>

          <AnimatedSection delay={0.2} forceVisible={isExporting}>
            <ExpenseSummaryCard expenses={data.expenses} />
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.3} id="transactions-table-section" forceVisible={isExporting}>
          <TransactionsTable records={allRecords} />
        </AnimatedSection>
      </main>

      <footer className="bg-white border-t py-6 mt-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>Financial Support for Ukrainian Yogis - {new Date().getFullYear()}</p>
          <p className="mt-1 text-xs text-gray-500">
            Data automatically synced from Google Sheets
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Dashboard() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
}
