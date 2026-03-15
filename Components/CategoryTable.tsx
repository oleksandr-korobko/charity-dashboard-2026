import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { formatCurrency, formatPercentage, cleanAndTranslateCategoryName } from "../src/lib/utils";
import { useLanguage } from "../src/contexts/LanguageContext";

interface CategoryTableProps {
  data: Array<{
    "Paid EUR": number;
    Category: string;
    City: string;
    Date: string;
  }>;
}

export default function CategoryTable({ data }: CategoryTableProps) {
  const { t, language } = useLanguage();
  const total = data.reduce((sum, item) => sum + item["Paid EUR"], 0);
  
  const grouped = data.reduce((acc, curr) => {
    const translatedCategory = cleanAndTranslateCategoryName(curr.Category, language);
    acc[translatedCategory] = (acc[translatedCategory] || 0) + curr["Paid EUR"];
    return acc;
  }, {} as Record<string, number>);

  const tableData = Object.entries(grouped)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('table.categoryBreakdown')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-sm font-semibold text-gray-600">{t('table.category')}</th>
                <th className="pb-3 text-sm font-semibold text-gray-600 text-right">{t('table.amount')}</th>
                <th className="pb-3 text-sm font-semibold text-gray-600 text-right">{t('table.percentage')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 text-sm text-gray-900">{row.category}</td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="py-3 text-sm text-gray-600 text-right">
                    {formatPercentage(row.percentage)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-semibold">
                <td className="py-3 text-sm text-gray-900">Total</td>
                <td className="py-3 text-sm text-gray-900 text-right"></td>
                <td className="py-3 text-sm text-gray-900 text-right">
                  {formatCurrency(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
} 