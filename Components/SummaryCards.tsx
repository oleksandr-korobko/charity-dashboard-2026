import React from "react";
import { Card, CardContent } from "../src/components/ui/card";
import { formatUSD, formatEUR } from "../src/lib/utils";
import { useLanguage } from "../src/contexts/LanguageContext";
import { TrendingUp, TrendingDown, Wallet, FileText } from "lucide-react";
import type { FinancialSummary } from "../src/types/financial";

interface SummaryCardsProps {
  summary: FinancialSummary;
  totalTransactions: number;
}

export default function SummaryCards({ summary, totalTransactions }: SummaryCardsProps) {
  const { t } = useLanguage();

  const cards = [
    {
      title: t('summary.totalIncome'),
      valueUSD: formatUSD(summary.totalIncomeUSD),
      valueEUR: formatEUR(summary.totalIncomeEUR),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: t('summary.totalExpenses'),
      valueUSD: formatUSD(summary.totalExpensesUSD),
      valueEUR: formatEUR(summary.totalExpensesEUR),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
    /* TODO: Повернути ці картки коли буде готова частина по витратам */
    // {
    //   title: t('summary.balance'),
    //   valueUSD: formatUSD(summary.balanceUSD),
    //   valueEUR: formatEUR(summary.balanceEUR),
    //   icon: Wallet,
    //   color: summary.balanceUSD >= 0 ? "text-blue-600" : "text-orange-600",
    //   bgColor: summary.balanceUSD >= 0 ? "bg-blue-50" : "bg-orange-50",
    //   borderColor: summary.balanceUSD >= 0 ? "border-blue-200" : "border-orange-200"
    // },
    // {
    //   title: t('summary.numberOfTransactions'),
    //   valueUSD: totalTransactions.toLocaleString(),
    //   valueEUR: "",
    //   icon: FileText,
    //   color: "text-purple-600",
    //   bgColor: "bg-purple-50",
    //   borderColor: "border-purple-200",
    //   singleValue: true
    // }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className={`relative overflow-hidden border-2 ${card.borderColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-3">{card.title}</p>
                  <div className="space-y-1">
                    <p className={`text-2xl font-bold ${card.color}`}>
                      {card.valueUSD}
                    </p>
                    <p className={`text-lg font-semibold ${card.color} opacity-75`}>
                      {card.valueEUR}
                    </p>
                  </div>
                </div>
                <div className={`${card.bgColor} p-3 rounded-full`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}