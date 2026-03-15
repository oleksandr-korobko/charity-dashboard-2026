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

    const financialData = {
      income: incomeData,
      expenses: [],
      summary: {
        totalIncomeUSD,
        totalIncomeEUR,
        totalExpensesUSD: 0,
        totalExpensesEUR: 0,
        balanceUSD: totalIncomeUSD,
        balanceEUR: totalIncomeEUR,
        lastUpdated: new Date().toISOString()
      }
    };

    // Update cache
    cachedData = financialData;
    cacheTimestamp = now;

    console.log(`✅ Successfully fetched ${incomeData.length} records`);

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
  const dateMatch = str.match(/^(\d{1,2})-(\w{3})-(\d{4})$/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    const monthMap = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    return `${day.padStart(2, '0')}.${monthMap[month]}.${year}`;
  }
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(str)) {
    return str;
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
