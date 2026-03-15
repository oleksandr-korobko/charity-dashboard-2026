import React, { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { formatCurrency } from "../src/lib/utils";
import { useLanguage } from "../src/contexts/LanguageContext";
import { useInView } from "framer-motion";

const COLORS = {
  USD: "#10b981", // green
  EUR: "#3b82f6", // blue
};

interface IncomeCurrencyPieChartProps {
  totalUSD: number;
  totalEUR: number;
}

export default function IncomeCurrencyPieChart({ totalUSD, totalEUR }: IncomeCurrencyPieChartProps) {
  const { t, language } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const total = totalUSD + totalEUR;

  const chartData = [
    {
      name: "USD",
      value: totalUSD,
      percentage: total > 0 ? ((totalUSD / total) * 100).toFixed(1) : "0.0",
      color: COLORS.USD
    },
    {
      name: "EUR",
      value: totalEUR,
      percentage: total > 0 ? ((totalEUR / total) * 100).toFixed(1) : "0.0",
      color: COLORS.EUR
    }
  ].filter(item => item.value > 0); // Only show currencies with actual values

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm" style={{ color: data.color }}>
            <span className="font-medium">${formatCurrency(data.value)}</span>
            <span className="ml-2 text-gray-500">({data.percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }: any) => {
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
        fontSize={isMobile ? 14 : 18}
        fontWeight={600}
      >
        {formattedValue}
      </text>
    );
  };

  const title = language === 'ua'
    ? 'Розподіл надходжень за валютами'
    : 'Income Distribution by Currency';

  return (
    <Card ref={ref} className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={isMobile ? 350 : 400}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={isMobile ? 100 : 140}
              innerRadius={0}
              paddingAngle={2}
              isAnimationActive={isInView}
              key={isInView ? 'animated' : 'static'}
              labelLine={false}
              label={renderCustomizedLabel}
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
                  {value}: ${formatCurrency(entry.payload.value)} ({entry.payload.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
