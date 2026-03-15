import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "../src/contexts/LanguageContext";
import type { FinancialSummary } from "../src/types/financial";

interface IncomeVsExpensesChartProps {
  summary: FinancialSummary;
}

export default function IncomeVsExpensesChart({ summary }: IncomeVsExpensesChartProps) {
  const { t } = useLanguage();
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');

  const data = [
    {
      name: t('type.income'),
      USD: summary.totalIncomeUSD,
      EUR: summary.totalIncomeEUR,
    },
    {
      name: t('type.expense'),
      USD: summary.totalExpensesUSD,
      EUR: summary.totalExpensesEUR,
    },
    {
      name: t('summary.balance'),
      USD: summary.balanceUSD,
      EUR: summary.balanceEUR,
    }
  ];

  const currentData = data.map(item => ({
    name: item.name,
    value: currency === 'USD' ? item.USD : item.EUR
  }));

  const getColor = (name: string, value: number) => {
    if (name === t('type.income')) return '#10b981';
    if (name === t('type.expense')) return '#ef4444';
    return value >= 0 ? '#3b82f6' : '#f97316';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            {t('charts.incomeVsExpenses')}
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                currency === 'USD'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setCurrency('EUR')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                currency === 'EUR'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              EUR
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(value),
                currency
              ]}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {currentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.name, entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
