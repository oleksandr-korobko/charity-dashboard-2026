import React, { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { formatCurrency, formatPercentage, cleanAndTranslateCategoryName } from "../src/lib/utils";
import { useLanguage } from "../src/contexts/LanguageContext";
import { useInView } from "framer-motion";

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
];

interface DataItem {
  "Paid EUR": number;
  Category: string;
  City: string;
  Date: string;
}

interface CategoryPieChartProps {
  data: DataItem[];
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
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

  const total = data.reduce((sum: number, item: DataItem) => sum + item["Paid EUR"], 0);
  
  const grouped = data.reduce((acc: Record<string, number>, curr: DataItem) => {
    const translatedCategory = cleanAndTranslateCategoryName(curr.Category, language);
    acc[translatedCategory] = (acc[translatedCategory] || 0) + curr["Paid EUR"];
    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([name, value]) => ({ 
      name, 
      value: value as number,
      percentage: ((value as number / total) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-lg max-w-xs">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-blue-600">
            <span className="font-medium">{formatCurrency(data.value)}</span>
            <span className="ml-2 text-gray-500">({data.percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }: any) => {
    const RADIAN = Math.PI / 180;
    const isTopTwo = index < 2; // For the two largest slices
    
    // Calculate distance differently for inside/outside
    const radius = isTopTwo 
      ? innerRadius + (outerRadius - innerRadius) * 0.6 
      : outerRadius + (isMobile ? 12 : 18);
      
    let x = cx + radius * Math.cos(-midAngle * RADIAN);
    let y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Hardcoded small offset to prevent 66 and 311 from overlapping
    // In our specific chart, these are the last items (indexes 6 and 7) on the bottom right/left
    if (!isTopTwo && index >= chartData.length - 2) {
       // Push the smallest slice (index 7, typically €66) slightly higher and further out
       if (index === chartData.length - 1) {
         y -= 12;
         x -= 4;
       } else {
         // Push the second smallest slice (index 6, typically €311) slightly lower
         y += 4;
       }
    }

    const formattedValue = formatCurrency(value);
    const textAnchor = isTopTwo ? "middle" : (x > cx ? "start" : "end");

    return (
      <text
        x={x}
        y={y}
        fill={isTopTwo ? "white" : "#111827"}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={isTopTwo ? (isMobile ? 12 : 14) : (isMobile ? 10 : 12)}
        fontWeight={isTopTwo ? 600 : 500}
      >
        {formattedValue}
      </text>
    );
  };

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle>{t('charts.categoryDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={isMobile ? 380 : 450}>
          <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy={isMobile ? "50%" : "45%"}
              outerRadius={isMobile ? 82 : 120}
              innerRadius={0}
              paddingAngle={2}
              isAnimationActive={isInView}
              key={isInView ? 'animated' : 'static'}
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ 
                fontSize: '12px',
                paddingTop: isMobile ? '30px' : '10px'
              }}
              formatter={(value: string, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value} ({formatPercentage(parseFloat(entry.payload.percentage))})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}