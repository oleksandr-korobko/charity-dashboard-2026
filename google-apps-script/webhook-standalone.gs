/**
 * Standalone Apps Script для синхронізації з дашбордом
 *
 * НАЛАШТУВАННЯ:
 * 1. Створіть новий проект: https://script.google.com/create
 * 2. Вставте цей код
 * 3. Змініть SHEET_ID на ID вашої таблиці
 * 4. Збережіть
 * 5. Налаштуйте тригер: Run → syncData → Time-based → Every 1 minute
 */

// НАЛАШТУВАННЯ
const SHEET_ID = '1FG88K8mutRm6-Z8ZrRgM4gd_rBtZre2LWtdyi6VXckw';
const WEBHOOK_URL = 'https://your-app.vercel.app/api/webhook';
const WEBHOOK_SECRET = 'your-webhook-secret-here';

// Отримання даних з Google Sheets
function getSheetData() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('UA_Yogis');

    if (!sheet) {
      Logger.log('❌ Sheet not found');
      return null;
    }

    const data = sheet.getDataRange().getValues();
    return {
      timestamp: new Date().toISOString(),
      rowCount: data.length,
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    Logger.log('❌ Error reading sheet: ' + error.toString());
    return null;
  }
}

// Надсилання webhook
function sendWebhook(data) {
  try {
    const options = {
      'method': 'post',
      'headers': {
        'x-webhook-secret': WEBHOOK_SECRET,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(data),
      'muteHttpExceptions': true
    };

    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log('✅ Webhook sent successfully');
      return true;
    } else {
      Logger.log('⚠️ Webhook failed with code: ' + responseCode);
      return false;
    }
  } catch (error) {
    Logger.log('❌ Error sending webhook: ' + error.toString());
    return false;
  }
}

// Головна функція синхронізації
function syncData() {
  Logger.log('🔄 Starting sync...');

  const data = getSheetData();
  if (data) {
    sendWebhook(data);
  }
}

// Ручне тестування
function testConnection() {
  const ui = SpreadsheetApp.getUi();

  const data = getSheetData();
  if (!data) {
    Logger.log('❌ Failed to read sheet data');
    return;
  }

  const success = sendWebhook(data);

  if (success) {
    Logger.log('✅ Test successful');
  } else {
    Logger.log('❌ Test failed');
  }
}
