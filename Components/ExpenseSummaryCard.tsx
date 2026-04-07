import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { formatUSD, formatEUR } from "../src/lib/utils";
import { useLanguage } from "../src/contexts/LanguageContext";
import { TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useInView } from "framer-motion";
import type { ExpenseRecord } from "../src/types/financial";

interface ExpenseSummaryCardProps {
  expenses: ExpenseRecord[];
}

const CATEGORY_COLORS = [
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

export default function ExpenseSummaryCard({ expenses }: ExpenseSummaryCardProps) {
  const { language } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Calculate totals
  const totalUSD = expenses.reduce((sum, expense) => sum + expense.paidUSD, 0);
  const totalEUR = expenses.reduce((sum, expense) => sum + expense.paidEUR, 0);
  const totalAmount = totalUSD + totalEUR;

  // Group by category
  const categoryData = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    if (!acc[category]) {
      acc[category] = { usd: 0, eur: 0, count: 0 };
    }
    acc[category].usd += expense.paidUSD;
    acc[category].eur += expense.paidEUR;
    acc[category].count += 1;
    return acc;
  }, {} as Record<string, { usd: number; eur: number; count: number }>);

  // Sort categories by total amount (USD + EUR)
  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => (b.usd + b.eur) - (a.usd + a.eur))
    .slice(0, 5); // Top 5 categories

  // Prepare data for pie chart
  const chartData = sortedCategories.map(([category, data], index) => ({
    name: category,
    value: data.usd + data.eur,
    percentage: totalAmount > 0 ? ((data.usd + data.eur) / totalAmount * 100).toFixed(1) : '0.0',
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  }));

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const formattedValue = `$${formatCurrency(value)}`;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        fontWeight={600}
      >
        {formattedValue}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm" style={{ color: data.color }}>
            <span className="font-medium">${data.value.toFixed(2)}</span>
            <span className="ml-2 text-gray-500">({data.percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full" ref={ref}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-600" />
          {language === 'ua' ? 'Підсумок витрат' : 'Expenses Summary'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={140}
                innerRadius={0}
                paddingAngle={2}
                isAnimationActive={isInView}
                key={isInView ? 'animated' : 'static'}
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  fontSize: '14px',
                  paddingTop: '20px',
                  fontWeight: 500
                }}
                formatter={(value: string, entry: any) => (
                  <span style={{ color: entry.payload.color }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
