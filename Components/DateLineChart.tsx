import React, { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/uk";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { formatCurrency } from "../src/lib/utils";
import { useLanguage } from "../src/contexts/LanguageContext";
import { useInView } from "framer-motion";

// Enable custom parse format plugin for dayjs
dayjs.extend(customParseFormat);

interface DataItem {
  "Paid EUR": number;
  Category: string;
  City: string;
  Date: string;
}

interface DateLineChartProps {
  data: DataItem[];
  startDate?: string;
  endDate?: string;
}

// Helper function to parse different date formats
const parseDate = (dateString: string): dayjs.Dayjs => {
  // Handle DD.MM.YYYY format
  if (dateString.includes('.')) {
    return dayjs(dateString, "DD.MM.YYYY");
  }
  // Handle D-MMM-YYYY or DD-MMM-YYYY format (single or double digit day)
  return dayjs(dateString, "D-MMM-YYYY");
};

export default function DateLineChart({ data, startDate, endDate }: DateLineChartProps) {
  const { t, language } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 }); // Trigger when 30% visible

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const grouped = data.reduce((acc: Record<string, number>, curr: DataItem) => {
    // Parse the date properly and format to YYYY-MM
    const parsedDate = parseDate(curr.Date);
    if (parsedDate.isValid()) {
      const month = parsedDate.format("YYYY-MM");
      acc[month] = (acc[month] || 0) + curr["Paid EUR"];
    }
    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const peakIndexes = useMemo(() => {
    if (!chartData.length) return new Set<number>();
    const peaks = new Set<number>();
    for (let i = 0; i < chartData.length; i++) {
      const prev = i > 0 ? chartData[i - 1].value : undefined;
      const curr = chartData[i].value;
      const next = i < chartData.length - 1 ? chartData[i + 1].value : undefined;
      if (prev !== undefined && next !== undefined && curr > prev && curr > next) peaks.add(i);
    }
    peaks.add(chartData.length - 1);
    return peaks;
  }, [chartData]);

  const mobileTickDates = useMemo(() => {
    if (!chartData.length) return [] as string[];
    const tickSet = new Set<string>();

    const mustHave = [
      '2022-04',
      '2022-11',
      '2023-01',
      '2023-04',
      '2023-07',
      '2023-11',
      '2024-02',
      '2024-11'
    ];

    if (chartData[0].date !== '2022-03') tickSet.add(chartData[0].date);
    tickSet.add(chartData[chartData.length - 1].date);

    mustHave.forEach((ym) => {
      if (chartData.some(d => d.date === ym)) tickSet.add(ym);
    });

    return chartData.map(d => d.date).filter(d => d !== '2022-03' && tickSet.has(d));
  }, [chartData, peakIndexes]);

  const CustomDesktopTick = (props: any) => {
    const { x, y, payload } = props;
    const value = payload?.value;
    if (!value) return null;
    const m = dayjs(value);
    const month = m.locale(language === 'ua' ? 'uk' : 'en').format('MMM');
    const year = m.format('YYYY');
    return (
      <text x={x} y={y + (isMobile ? 10 : 16)} textAnchor="middle" fill="#6b7280" fontSize={isMobile ? 10 : 12}>
        <tspan x={x} dy="0">{month}</tspan>
        <tspan x={x} dy={isMobile ? "12" : "14"}>{year}</tspan>
      </text>
    );
  };

  // Constrain axis to actual data range
  const dates = chartData.map(item => item.date);
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="text-sm font-medium">
            {dayjs(label).locale(language === 'ua' ? 'uk' : 'en').format("MMMM YYYY")}
          </p>
          <p className="text-sm text-green-600">
            <span className="font-medium">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
          <span>{t('charts.aidDynamics')}</span>
          {startDate && endDate ? (
            <span className="text-sm font-normal text-gray-500">
              {'('}
              {dayjs(startDate).locale(language === 'ua' ? 'uk' : 'en').format('DD MMM YYYY')}
              {' — '}
              {dayjs(endDate).locale(language === 'ua' ? 'uk' : 'en').format('DD MMM YYYY')}
              {')'}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ touchAction: 'pan-y' }}>
          <ResponsiveContainer width="100%" height={300}>
          <LineChart
            key={isInView ? 'animated' : 'static'}
            data={chartData}
            margin={{ top: isMobile ? 28 : 8, right: 16, bottom: 8, left: 8 }}
          >
             {/* ... existing axes/tooltip ... */}
            <XAxis 
              dataKey="date" 
              tick={<CustomDesktopTick />}
              tickFormatter={undefined}
              ticks={isMobile ? mobileTickDates : undefined}
              interval={0}
              height={isMobile ? 44 : 56}
              domain={[minDate, maxDate]}
              type="category" 
            />
            <YAxis 
              hide={isMobile}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const kValue = (value / 1000).toFixed(0);
                return language === 'ua' ? `€${kValue} тис.` : `€${kValue}k`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={2000}
              animationEasing="ease-in-out"
              key={isInView ? 'animated-line' : 'static-line'}
            >
              {isMobile && (
                <LabelList
                  dataKey="value"
                  position="top"
                  content={(props: any) => {
                    const { x, y, index, value } = props;
                    if (!peakIndexes.has(index)) return null;
                    return (
                      <text
                        x={x}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#059669"
                        fontWeight={600}
                      >
                        {formatCurrency(value)}
                      </text>
                    );
                  }}
                />
              )}
            </Line>
          </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}