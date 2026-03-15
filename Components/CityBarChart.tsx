import React, { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { formatCurrency, translateCityName } from "../src/lib/utils";
import { useLanguage } from "../src/contexts/LanguageContext";
import { useInView } from "framer-motion";

interface DataItem {
  "Paid EUR": number;
  Category: string;
  City: string;
  Date: string;
}

interface CityBarChartProps {
  data: DataItem[];
}

export default function CityBarChart({ data }: CityBarChartProps) {
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

  const grouped = data.reduce((acc: Record<string, number>, curr: DataItem) => {
    const translatedCity = translateCityName(curr.City, language);
    acc[translatedCity] = (acc[translatedCity] || 0) + curr["Paid EUR"];
    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 10); // top 10

  const isLargest = (index: number) => index === 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-blue-600">
            <span className="font-medium">{formatCurrency(payload[0].value as number)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle>{t('charts.topCities')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ touchAction: 'pan-y' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ left: isMobile ? 4 : 8, right: 16, top: 16, bottom: 16 }}
            >
            <XAxis 
              type="number" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const kValue = (value / 1000).toFixed(0);
                return language === 'ua' ? `€${kValue} тис.` : `€${kValue}k`;
              }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              hide={true}
              width={120} 
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
              isAnimationActive={isInView}
              key={isInView ? 'animated' : 'static'}
            >
              <LabelList
                dataKey="name"
                content={(props: any) => {
                  const { x, y, width, height, value, index } = props;
                  const label = String(value ?? '');
                  const cy = (y ?? 0) + (height ?? 0) / 2 + 4;

                  if (isLargest(index)) {
                    return (
                      <text
                        x={(x ?? 0) + (width ?? 0) - 6}
                        y={cy}
                        textAnchor="end"
                        fontSize={10}
                        fill="#ffffff"
                        fontWeight={600}
                      >
                        {label}
                      </text>
                    );
                  }

                  return (
                    <text
                      x={(x ?? 0) + (width ?? 0) + 6}
                      y={cy}
                      textAnchor="start"
                      fontSize={10}
                      fill="#111827"
                      fontWeight={500}
                    >
                      {label}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}