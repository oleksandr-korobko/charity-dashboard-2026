import { google } from 'googleapis';

// Cache data for 30 seconds to avoid hitting API limits
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Rate limiting for force refresh
const forceRefreshCooldown = new Map();
const FORCE_REFRESH_LIMIT = 10000; // 10 seconds

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if force refresh requested
  const forceRefresh = req.query.force === 'true';
  const now = Date.now();

  // Rate limiting for force refresh
  if (forceRefresh) {
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const lastForceRefresh = forceRefreshCooldown.get(clientIP) || 0;
    const timeSinceLastForce = now - lastForceRefresh;

    if (timeSinceLastForce < FORCE_REFRESH_LIMIT) {
      console.log(`Rate limit: Force refresh too soon from ${clientIP}`);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
    }

    forceRefreshCooldown.set(clientIP, now);

    // Clean old entries
    for (const [ip, timestamp] of forceRefreshCooldown.entries()) {
      if (now - timestamp > 3600000) {
        forceRefreshCooldown.delete(ip);
      }
    }
  }

  // Check cache first (skip if force refresh and passed rate limit)
  if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('Returning cached data');
    return res.status(200).json(cachedData);
  }

  try {
    console.log('Fetching fresh data from Google Sheets...');

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
      return res.status(200).json({
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

    console.log(`Successfully fetched ${incomeData.length} records`);

    return res.status(200).json(financialData);

  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({
      error: 'Failed to fetch data',
      message: error.message
    });
  }
}

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
