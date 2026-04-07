export interface IncomeRecord {
  id: string;
  date: string;
  paidUSD: number;
  paidEUR: number;
  type: 'income';
}

export interface ExpenseRecord {
  id: string;
  date: string;
  paidUSD: number;
  paidEUR: number;
  city: string;
  category: string;
  beneficiary: string;
  card: string;
  type: 'expense';
}

export type FinancialRecord = IncomeRecord | ExpenseRecord;

export interface FinancialSummary {
  totalIncomeUSD: number;
  totalIncomeEUR: number;
  totalExpensesUSD: number;
  totalExpensesEUR: number;
  balanceUSD: number;
  balanceEUR: number;
  lastUpdated: string;
}

export interface FinancialData {
  income: IncomeRecord[];
  expenses: ExpenseRecord[];
  summary: FinancialSummary;
}

export interface MonthlyData {
  month: string;
  incomeUSD: number;
  incomeEUR: number;
  expensesUSD: number;
  expensesEUR: number;
  balanceUSD: number;
  balanceEUR: number;
}

export interface CategoryData {
  category: string;
  amountUSD: number;
  amountEUR: number;
  percentage: number;
}
