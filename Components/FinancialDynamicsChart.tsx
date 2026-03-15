import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { useLanguage } from "../src/contexts/LanguageContext";
import type { FinancialRecord } from "../src/types/financial";

dayjs.extend(customParseFormat);

interface FinancialDynamicsChartProps {
  income: FinancialRecord[];
  expenses: FinancialRecord[];
}

const parseDate = (dateString: string): dayjs.Dayjs => {
  if (dateString.includes('.')) {
    return dayjs(dateString, "DD.MM.YYYY");
  }
  return dayjs(dateString, "D-MMM-YYYY");
};

export default function FinancialDynamicsChart({ income, expenses }: FinancialDynamicsChartProps) {
  const { t } = useLanguage();
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');

  const chartData = useMemo(() => {
    const monthlyData = new Map<string, { incomeUSD: number; incomeEUR: number; expensesUSD: number; expensesEUR: number }>();

    income.forEach((record) => {
      const parsedDate = parseDate(record.date);
      if (parsedDate.isValid()) {
        const month = parsedDate.format("YYYY-MM");
        const existing = monthlyData.get(month) || { incomeUSD: 0, incomeEUR: 0, expensesUSD: 0, expensesEUR: 0 };
        existing.incomeUSD += record.paidUSD;
        existing.incomeEUR += record.paidEUR;
        monthlyData.set(month, existing);
      }
    });

    expenses.forEach((record) => {
      const parsedDate = parseDate(record.date);
      if (parsedDate.isValid()) {
        const month = parsedDate.format("YYYY-MM");
        const existing = monthlyData.get(month) || { incomeUSD: 0, incomeEUR: 0, expensesUSD: 0, expensesEUR: 0 };
        existing.expensesUSD += record.paidUSD;
        existing.expensesEUR += record.paidEUR;
        monthlyData.set(month, existing);
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        displayMonth: dayjs(month, "YYYY-MM").format("MMM YYYY"),
        incomeUSD: data.incomeUSD,
        incomeEUR: data.incomeEUR,
        expensesUSD: data.expensesUSD,
        expensesEUR: data.expensesEUR,
        balanceUSD: data.incomeUSD - data.expensesUSD,
        balanceEUR: data.incomeEUR - data.expensesEUR,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [income, expenses]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            {t('charts.financialDynamics')}
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
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="displayMonth"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(value)
              }
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(value)
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={currency === 'USD' ? 'incomeUSD' : 'incomeEUR'}
              stroke="#10b981"
              strokeWidth={2}
              name={t('type.income')}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey={currency === 'USD' ? 'expensesUSD' : 'expensesEUR'}
              stroke="#ef4444"
              strokeWidth={2}
              name={t('type.expense')}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey={currency === 'USD' ? 'balanceUSD' : 'balanceEUR'}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name={t('summary.balance')}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
