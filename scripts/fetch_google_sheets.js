import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.GOOGLE_API_KEY;
const INCOME_SHEET_ID = process.env.INCOME_SHEET_ID || '1FG88K8mutRm6-Z8ZrRgM4gd_rBtZre2LWtdyi6VXckw';
const INCOME_SHEET_NAME = process.env.INCOME_SHEET_NAME || 'UA_Yogis';
const EXPENSES_SHEET_ID = process.env.EXPENSES_SHEET_ID;
const EXPENSES_SHEET_NAME = process.env.EXPENSES_SHEET_NAME;

const sheets = google.sheets({ version: 'v4', auth: API_KEY });

// Parse date from DD-MMM-YYYY format (e.g., "16-Feb-2026")
function parseDate(dateStr) {
  if (!dateStr) return '';

  const str = dateStr.trim();

  // Try DD-MMM-YYYY format (e.g., "16-Feb-2026")
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

  // Return as-is if already in DD.MM.YYYY format
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(str)) {
    return str;
  }

  return str;
}

// Parse currency value
function parseCurrency(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;

  // Remove currency symbols and spaces
  const cleaned = String(value).replace(/[$€,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Fetch income data from Google Sheets
async function fetchIncomeData() {
  try {
    console.log(`Fetching income data from sheet: ${INCOME_SHEET_ID}...`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: INCOME_SHEET_ID,
      range: `${INCOME_SHEET_NAME}!A:D`, // Columns A-D (ID, Date, Paid $ PayPal, Paid EUR IBAN)
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No income data found.');
      return [];
    }

    const incomeData = [];

    // Skip header rows (first 2 rows based on the screenshot)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];

      // Skip empty rows
      if (!row || row.length === 0) continue;

      const id = row[0] || '';
      const date = parseDate(row[1] || '');
      const paidUSD = parseCurrency(row[2] || '0');
      const paidEUR = parseCurrency(row[3] || '0');

      // Skip rows without any payment data
      if (paidUSD === 0 && paidEUR === 0) continue;

      incomeData.push({
        id,
        date,
        paidUSD,
        paidEUR,
        type: 'income'
      });
    }

    console.log(`Successfully fetched ${incomeData.length} income records.`);

    // Calculate totals
    const totalUSD = incomeData.reduce((sum, item) => sum + item.paidUSD, 0);
    const totalEUR = incomeData.reduce((sum, item) => sum + item.paidEUR, 0);
    console.log(`Total Income USD: $${totalUSD.toFixed(2)}`);
    console.log(`Total Income EUR: €${totalEUR.toFixed(2)}`);

    return incomeData;
  } catch (error) {
    console.error('Error fetching income data:', error.message);
    throw error;
  }
}

// Fetch expenses data from Google Sheets
async function fetchExpensesData() {
  if (!EXPENSES_SHEET_ID || !EXPENSES_SHEET_NAME) {
    console.log('Expenses sheet not configured yet. Skipping...');
    return [];
  }

  try {
    console.log(`Fetching expenses data from sheet: ${EXPENSES_SHEET_ID}...`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: EXPENSES_SHEET_ID,
      range: `${EXPENSES_SHEET_NAME}!A:E`, // Adjust range based on actual structure
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No expenses data found.');
      return [];
    }

    const expensesData = [];

    // Skip header rows (adjust based on actual structure)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];

      if (!row || row.length === 0) continue;

      const id = row[0] || '';
      const date = parseDate(row[1] || '');
      const paidUSD = parseCurrency(row[2] || '0');
      const paidEUR = parseCurrency(row[3] || '0');
      const category = row[4] || '';

      if (paidUSD === 0 && paidEUR === 0) continue;

      expensesData.push({
        id,
        date,
        paidUSD,
        paidEUR,
        category,
        type: 'expense'
      });
    }

    console.log(`Successfully fetched ${expensesData.length} expense records.`);

    const totalUSD = expensesData.reduce((sum, item) => sum + item.paidUSD, 0);
    const totalEUR = expensesData.reduce((sum, item) => sum + item.paidEUR, 0);
    console.log(`Total Expenses USD: $${totalUSD.toFixed(2)}`);
    console.log(`Total Expenses EUR: €${totalEUR.toFixed(2)}`);

    return expensesData;
  } catch (error) {
    console.error('Error fetching expenses data:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  if (!API_KEY) {
    console.error('Error: GOOGLE_API_KEY not found in .env file');
    console.log('\nPlease follow these steps to get your API key:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create a new project or select an existing one');
    console.log('3. Enable the Google Sheets API');
    console.log('4. Go to "Credentials" and create an API key');
    console.log('5. Copy the API key to your .env file as GOOGLE_API_KEY=your_key_here');
    console.log('\nAlso make sure your Google Sheets are publicly accessible:');
    console.log('- Open your Google Sheet');
    console.log('- Click "Share" button');
    console.log('- Change to "Anyone with the link" can view');
    process.exit(1);
  }

  try {
    // Fetch both income and expenses data
    const incomeData = await fetchIncomeData();
    const expensesData = await fetchExpensesData();

    // Combine all data
    const allData = {
      income: incomeData,
      expenses: expensesData,
      summary: {
        totalIncomeUSD: incomeData.reduce((sum, item) => sum + item.paidUSD, 0),
        totalIncomeEUR: incomeData.reduce((sum, item) => sum + item.paidEUR, 0),
        totalExpensesUSD: expensesData.reduce((sum, item) => sum + item.paidUSD, 0),
        totalExpensesEUR: expensesData.reduce((sum, item) => sum + item.paidEUR, 0),
        lastUpdated: new Date().toISOString()
      }
    };

    // Calculate balance
    allData.summary.balanceUSD = allData.summary.totalIncomeUSD - allData.summary.totalExpensesUSD;
    allData.summary.balanceEUR = allData.summary.totalIncomeEUR - allData.summary.totalExpensesEUR;

    // Save to JSON file
    const outputPath = path.join(__dirname, '../data/financial-data-2026.json');
    fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));

    console.log('\n✓ Data successfully saved to:', outputPath);
    console.log('\nSummary:');
    console.log(`- Income records: ${incomeData.length}`);
    console.log(`- Expense records: ${expensesData.length}`);
    console.log(`- Balance USD: $${allData.summary.balanceUSD.toFixed(2)}`);
    console.log(`- Balance EUR: €${allData.summary.balanceEUR.toFixed(2)}`);

  } catch (error) {
    console.error('Failed to fetch data:', error.message);
    process.exit(1);
  }
}

main();
