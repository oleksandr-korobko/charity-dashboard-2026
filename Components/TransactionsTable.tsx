import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { formatUSD, formatEUR } from "../src/lib/utils";
import { useLanguage } from "../src/contexts/LanguageContext";
import { ArrowUpCircle, ArrowDownCircle, Search } from "lucide-react";
import type { FinancialRecord } from "../src/types/financial";

interface TransactionsTableProps {
  records: FinancialRecord[];
}

export default function TransactionsTable({ records }: TransactionsTableProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortField, setSortField] = useState<'date' | 'amountUSD' | 'amountEUR'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records;

    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => {
        if (r.type === 'expense' && 'category' in r) {
          return r.category.toLowerCase().includes(term) || r.date.includes(term);
        }
        return r.date.includes(term);
      });
    }

    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'amountUSD') {
        comparison = a.paidUSD - b.paidUSD;
      } else if (sortField === 'amountEUR') {
        comparison = a.paidEUR - b.paidEUR;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [records, searchTerm, filterType, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {t('table.transactionsTitle')}
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('table.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('filters.all')}
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('type.income')}
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterType === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('type.expense')}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  {t('table.type')}
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('date')}
                >
                  {t('table.date')} {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('amountUSD')}
                >
                  {t('table.amountUSD')} {sortField === 'amountUSD' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('amountEUR')}
                >
                  {t('table.amountEUR')} {sortField === 'amountEUR' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  {t('table.category')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRecords.map((record, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {record.type === 'income' ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <ArrowUpCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('type.income')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <ArrowDownCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('type.expense')}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{record.date}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {record.paidUSD > 0 ? formatUSD(record.paidUSD) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {record.paidEUR > 0 ? formatEUR(record.paidEUR) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record.type === 'expense' && 'category' in record ? record.category : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAndSortedRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions found
            </div>
          )}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredAndSortedRecords.length} of {records.length} transactions
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
