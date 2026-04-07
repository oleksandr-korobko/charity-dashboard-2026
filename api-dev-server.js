/**
 * Development API Server
 * Емулює Vercel serverless functions локально
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());

// Cache
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Rate limiting for force refresh
const forceRefreshCooldown = new Map(); // IP -> timestamp
const FORCE_REFRESH_LIMIT = 10000; // 10 seconds between force refreshes per IP

app.get('/api/data', async (req, res) => {
  // Check if force refresh requested
  const forceRefresh = req.query.force === 'true';
  const now = Date.now();

  // Rate limiting for force refresh
  if (forceRefresh) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const lastForceRefresh = forceRefreshCooldown.get(clientIP) || 0;
    const timeSinceLastForce = now - lastForceRefresh;

    if (timeSinceLastForce < FORCE_REFRESH_LIMIT) {
      console.log(`⚠️ Rate limit: Force refresh too soon from ${clientIP}`);
      // Return cached data instead of blocking completely
      if (cachedData) {
        return res.json(cachedData);
      }
    }

    // Update last force refresh time
    forceRefreshCooldown.set(clientIP, now);

    // Clean old entries (older than 1 hour)
    for (const [ip, timestamp] of forceRefreshCooldown.entries()) {
      if (now - timestamp > 3600000) {
        forceRefreshCooldown.delete(ip);
      }
    }
  }

  // Check cache (skip if force refresh and passed rate limit)
  if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('✅ Returning cached data');
    return res.json(cachedData);
  }

  try {
    console.log('📊 Fetching fresh data from Google Sheets...');

    const sheets = google.sheets({
      version: 'v4',
      auth: process.env.GOOGLE_API_KEY
    });

    const INCOME_SHEET_ID = process.env.INCOME_SHEET_ID || '1FG88K8mutRm6-Z8ZrRgM4gd_rBtZre2LWtdyi6VXckw';
    const INCOME_SHEET_NAME = process.env.INCOME_SHEET_NAME || 'UA_Yogis';
    const EXPENSES_SHEET_ID = process.env.EXPENSES_SHEET_ID || '1MwPVKYeTbUNYyPao6u9pIPh76TXsNqpw3gqS971qXoI';
    const EXPENSES_SHEET_NAME = process.env.EXPENSES_SHEET_NAME || 'Витрати';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: INCOME_SHEET_ID,
      range: `${INCOME_SHEET_NAME}!A:D`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json({
        income: [],
        expenses: [],
        summary: {
          totalIncomeUSD: 0,
          totalIncomeEUR: 0,
          totalExpensesUSD: 0,
          totalExpensesEUR: 0,
          balanceUSD: 0,
          balanceEUR: 0,
          lastUpdated: new Date().toISOString()
        }
      });
    }

    const incomeData = [];

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

          if (i === 2) {
            console.log(`📊 First expense row full:`, JSON.stringify(row));
            console.log(`📊 Parsed: date=${date}, row[1]=${row[1]}, row[2]=${row[2]}, USD=${amountUSDStr}, EUR=${amountEURStr}, category=${category}`);
          }

          if (paidUSD === 0 && paidEUR === 0) {
            if (i <= 4) console.log(`⚠️ Skipping row ${i}: zero amount`);
            continue;
          }

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
      // Continue with empty expenses if there's an error
    }

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

    // Update cache
    cachedData = financialData;
    cacheTimestamp = now;

    console.log(`✅ Successfully fetched ${incomeData.length} income records and ${expensesData.length} expense records`);

    return res.json(financialData);

  } catch (error) {
    console.error('❌ Error fetching data:', error);
    return res.status(500).json({
      error: 'Failed to fetch data',
      message: error.message
    });
  }
});

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

app.listen(PORT, () => {
  console.log(`\n🚀 Dev API Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/data\n`);
});
