#!/usr/bin/env node

/**
 * Створення standalone Apps Script (не прив'язаного до таблиці)
 * Цей метод обходить помилку 400 при створенні bound script
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔧 Обхід помилки 400: Створення standalone Apps Script\n');

console.log('📋 МЕТОД 1: Створити Apps Script окремо\n');

console.log('1️⃣  Відкрити script.google.com/create');
console.log('2️⃣  Вставити код (вже скопійований)');
console.log('3️⃣  File → Project Settings → додати Script ID до таблиці\n');

console.log('─'.repeat(80));
console.log('\n💡 АБО МЕТОД 2 (рекомендований): Використати тригер Time-based\n');

// Створюємо версію з Time-based тригером замість onEdit
const webhookCode = fs.readFileSync(
  path.join(__dirname, '../google-apps-script/webhook.gs'),
  'utf-8'
);

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Модифікуємо код для standalone версії
const standaloneCode = `/**
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
const SHEET_ID = '${process.env.INCOME_SHEET_ID}';
const WEBHOOK_URL = 'https://your-app.vercel.app/api/webhook';
const WEBHOOK_SECRET = '${WEBHOOK_SECRET}';

// Отримання даних з Google Sheets
function getSheetData() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('${process.env.INCOME_SHEET_NAME}');

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
`;

// Зберігаємо standalone версію
const standalonePath = path.join(__dirname, '../google-apps-script/webhook-standalone.gs');
fs.writeFileSync(standalonePath, standaloneCode);

console.log('✅ Створено standalone версію: webhook-standalone.gs\n');

console.log('📖 ІНСТРУКЦІЯ:\n');
console.log('1. Відкрийте: https://script.google.com/create');
console.log('2. Вставте код з файлу: google-apps-script/webhook-standalone.gs');
console.log('3. Збережіть проект (Ctrl+S)');
console.log('4. Налаштуйте тригер:');
console.log('   → Значок ⏰');
console.log('   → + Add Trigger');
console.log('   → Function: syncData');
console.log('   → Event source: Time-driven');
console.log('   → Type: Minutes timer');
console.log('   → Every: 1 minute');
console.log('   → Save\n');

console.log('─'.repeat(80));
console.log('\n🔍 ДІАГНОСТИКА ПОМИЛКИ 400:\n');

console.log('Можливі причини:');
console.log('1. Apps Script API не увімкнено');
console.log('2. Немає прав на редагування таблиці');
console.log('3. Google Workspace обмеження');
console.log('4. Таблиця створена в іншому акаунті\n');

console.log('🔧 РІШЕННЯ:\n');
console.log('Спробуйте:');
console.log('• Перевірити чи ви власник таблиці');
console.log('• Створити копію таблиці (File → Make a copy)');
console.log('• Використати standalone скрипт (інструкція вище)\n');

console.log('═'.repeat(80));

// Спробуємо відкрити script.google.com/create
const open = (url) => {
  const start =
    process.platform == 'darwin' ? 'open' :
    process.platform == 'win32' ? 'start' : 'xdg-open';

  exec(`${start} ${url}`);
};

setTimeout(() => {
  console.log('\n📂 Відкриваю script.google.com для створення нового проекту...\n');
  open('https://script.google.com/create');
}, 1000);

console.log('💡 Код також скопійовано в буфер обміну!\n');

// Копіюємо в буфер обміну
try {
  const platform = process.platform;
  const copyCommand =
    platform === 'darwin' ? 'pbcopy' :
    platform === 'win32' ? 'clip' : 'xclip';

  exec(`echo "${standaloneCode.replace(/"/g, '\\"')}" | ${copyCommand}`);
} catch (e) {
  // Ignore
}
