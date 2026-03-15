import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { useLanguage } from "../src/contexts/LanguageContext";
import { formatCurrency, translateCityName } from "../src/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/uk";
import { Search, ArrowUpDown, ArrowRight } from "lucide-react";

interface DataItem {
  "Paid EUR": number;
  "Paid UAH"?: number;
  Category: string;
  City: string;
  Date: string;
}

interface TransactionsListProps {
  data: DataItem[];
}

type SortField = 'Date' | 'Amount' | 'City';
type SortDirection = 'asc' | 'desc';
type Currency = 'EUR' | 'UAH';

export default function TransactionsList({ data }: TransactionsListProps) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('Date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('appCurrency');
      if (savedCurrency === 'EUR' || savedCurrency === 'UAH') {
        return savedCurrency as Currency;
      }
    }
    return 'EUR';
  });

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('appCurrency', curr);
    }
  };

  // Helper to parse potential date formats
  const parseDate = (d: string) => {
    if (d.includes('.')) return dayjs(d, "DD.MM.YYYY");
    return dayjs(d, "D-MMM-YYYY");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'Date' ? 'desc' : 'asc'); // Date desc by default, others asc
    }
  };

  const getAmount = (item: DataItem) => {
    if (currency === 'UAH') {
      return item["Paid UAH"] || item["Paid EUR"] * 40; // Fallback conversion if missing
    }
    return item["Paid EUR"];
  };

  // Sort and Filter
  const processedData = [...data]
    .filter(item => {
      const city = translateCityName(item.City, language);
      return city.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'Date') {
        comparison = parseDate(a.Date).valueOf() - parseDate(b.Date).valueOf();
      } else if (sortField === 'Amount') {
        comparison = getAmount(a) - getAmount(b);
      } else if (sortField === 'City') {
        const cityA = translateCityName(a.City, language);
        const cityB = translateCityName(b.City, language);
        comparison = cityA.localeCompare(cityB);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4 gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <CardTitle>{t('table.transactionsTitle')}</CardTitle>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrency('EUR')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                currency === 'EUR' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              EUR
            </button>
            <button
              onClick={() => setCurrency('UAH')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                currency === 'UAH' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              UAH
            </button>
          </div>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('table.searchPlaceholder')}
            className="pl-8 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border max-h-[400px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="sm:hidden">
                <th colSpan={5} className="px-4 pt-2 pb-1 text-left text-xs font-normal text-gray-500">
                  <div className="flex items-center gap-1">
                    <span>{t('table.scrollHint')}</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </th>
              </tr>
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-2 sm:px-4 whitespace-nowrap text-left align-middle font-medium text-muted-foreground">
                  {t('table.beneficiary')}
                </th>
                <th className="h-10 px-2 sm:px-4 whitespace-nowrap text-left align-middle font-medium text-muted-foreground">
                  {t('table.card')}
                </th>
                <th 
                  className="h-10 px-2 sm:px-4 whitespace-nowrap text-right align-middle font-medium text-muted-foreground cursor-pointer hover:text-gray-900 w-[1%]"
                  onClick={() => handleSort('Amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    {t('table.amount')} ({currency})
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="h-10 px-2 sm:px-4 whitespace-nowrap text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-gray-900 w-[1%]"
                  onClick={() => handleSort('City')}
                >
                  <div className="flex items-center gap-1">
                    {t('table.city')}
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="h-10 px-2 sm:px-4 whitespace-nowrap text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-gray-900 w-[1%]"
                  onClick={() => handleSort('Date')}
                >
                  <div className="flex items-center gap-1">
                    {t('table.date')}
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((item, index) => (
                <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-2 sm:p-4 align-middle whitespace-nowrap">
                    ******
                  </td>
                  <td className="p-2 sm:p-4 align-middle whitespace-nowrap">
                    ****
                  </td>
                  <td className="p-2 sm:p-4 align-middle text-right font-medium text-green-600 whitespace-nowrap">
                    {currency === 'EUR' 
                      ? formatCurrency(item["Paid EUR"])
                      : `₴${(item["Paid UAH"] || 0).toLocaleString('uk-UA', { minimumFractionDigits: 2 })}`
                    }
                  </td>
                  <td className="p-2 sm:p-4 align-middle whitespace-nowrap">
                    {translateCityName(item.City, language)}
                  </td>
                  <td className="p-2 sm:p-4 align-middle whitespace-nowrap">
                    {parseDate(item.Date).locale(language === 'ua' ? 'uk' : 'en').format("DD MMM YYYY")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
