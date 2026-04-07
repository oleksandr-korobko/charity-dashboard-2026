// Test endpoint to check environment variables
export default async function handler(req, res) {
  return res.json({
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Set' : 'Not set',
    INCOME_SHEET_ID: process.env.INCOME_SHEET_ID || 'Not set',
    INCOME_SHEET_NAME: process.env.INCOME_SHEET_NAME || 'Not set',
    EXPENSES_SHEET_ID: process.env.EXPENSES_SHEET_ID || 'Not set',
    EXPENSES_SHEET_NAME: process.env.EXPENSES_SHEET_NAME || 'Not set'
  });
}
