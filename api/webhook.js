import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// This is a Vercel serverless function that receives webhooks from Google Sheets
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook secret (optional security)
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Webhook received, fetching data from Google Sheets...');

    // Initialize Google Sheets API
    const sheets = google.sheets({
      version: 'v4',
      auth: process.env.GOOGLE_API_KEY
    });

    const INCOME_SHEET_ID = process.env.INCOME_SHEET_ID || '1FG88K8mutRm6-Z8ZrRgM4gd_rBtZre2LWtdyi6VXckw';
    const INCOME_SHEET_NAME = process.env.INCOME_SHEET_NAME || 'UA_Yogis';
    const EXPENSES_SHEET_ID = process.env.EXPENSES_SHEET_ID || '1MwPVKYeTbUNYyPao6u9pIPh76TXsNqpw3gqS971qXoI';
    const EXPENSES_SHEET_NAME = process.env.EXPENSES_SHEET_NAME || 'Витрати';

    // Fetch income data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: INCOME_SHEET_ID,
      range: `${INCOME_SHEET_NAME}!A:D`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(200).json({ message: 'No data found' });
    }

    const incomeData = [];

    // Parse data (skip first 2 header rows)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const id = row[0] || '';
      const date = parseDate(row[1] || '');
      const paidUSD = parseCurrency(row[2] || '0');
      const paidEUR = parseCurrency(row[3] || '0');

      if (paidUSD === 0 && paidEUR === 0) continue;

      incomeData.push({
        id,
        date,
        paidUSD,
        paidEUR,
        type: 'income'
      });
    }

    // Calculate totals
    const totalIncomeUSD = incomeData.reduce((sum, item) => sum + item.paidUSD, 0);
    const totalIncomeEUR = incomeData.reduce((sum, item) => sum + item.paidEUR, 0);

    // Fetch expenses data
    let expensesData = [];
    let totalExpensesUSD = 0;
    let totalExpensesEUR = 0;

    console.log(`📊 Attempting to fetch expenses from sheet: ${EXPENSES_SHEET_ID}, range: ${EXPENSES_SHEET_NAME}!A:G`);

    try {
      const expensesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: EXPENSES_SHEET_ID,
        range: `${EXPENSES_SHEET_NAME}!A:G`,
      });

      const expenseRows = expensesResponse.data.values;
      console.log(`📊 Fetched ${expenseRows ? expenseRows.length : 0} rows of expenses data`);

      if (expenseRows && expenseRows.length > 2) {
        // Parse expenses (skip first 2 rows: summary and headers)
        for (let i = 2; i < expenseRows.length; i++) {
          const row = expenseRows[i];
          if (!row || row.length === 0) continue;

          const date = parseDate(row[0] || '');
          const city = row[1] || '';
          const amountUSDStr = row[3] || '0';
          const amountEURStr = row[4] || '0';
          const category = row[6] || '';

          // Parse amounts directly (already separated by currency)
          const paidUSD = parseCurrency(amountUSDStr);
          const paidEUR = parseCurrency(amountEURStr);

          if (paidUSD === 0 && paidEUR === 0) continue;

          expensesData.push({
            id: `expense-${i}`,
            date,
            paidUSD,
            paidEUR,
            city,
            category,
            beneficiary: '******',
            card: '****',
            type: 'expense'
          });
        }

        // Sort expenses by date (newest first)
        expensesData.sort((a, b) => b.date.localeCompare(a.date));

        totalExpensesUSD = expensesData.reduce((sum, item) => sum + item.paidUSD, 0);
        totalExpensesEUR = expensesData.reduce((sum, item) => sum + item.paidEUR, 0);
        console.log(`✅ Successfully parsed ${expensesData.length} expense records`);
      } else {
        console.log(`⚠️ No expense rows found or empty sheet`);
      }
    } catch (expenseError) {
      console.error('❌ Error fetching expenses:', expenseError.message);
    }

    // Create financial data structure
    const financialData = {
      income: incomeData,
      expenses: expensesData,
      summary: {
        totalIncomeUSD,
        totalIncomeEUR,
        totalExpensesUSD,
        totalExpensesEUR,
        balanceUSD: totalIncomeUSD - totalExpensesUSD,
        balanceEUR: totalIncomeEUR - totalExpensesEUR,
        lastUpdated: new Date().toISOString()
      }
    };

    // In Vercel, we need to write to /tmp directory
    // But for production, you'd want to use a database or cloud storage
    // For now, we'll return the data and let the client handle it

    console.log(`Successfully processed ${incomeData.length} income records`);

    return res.status(200).json({
      success: true,
      message: `Updated ${incomeData.length} records`,
      data: financialData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message
    });
  }
}

// Helper functions
function parseDate(dateStr) {
  if (!dateStr) return '';
  const str = dateStr.trim();

  // DD.MM.YYYY format
  const ddmmyyyyMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // D-MMM-YYYY format
  const dateMatch = str.match(/^(\d{1,2})-(\w{3})-(\d{4})$/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    const monthMap = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    return `${year}-${monthMap[month]}-${day.padStart(2, '0')}`;
  }

  return str;
}

function parseCurrency(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;

  const cleaned = String(value).replace(/[$€,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
