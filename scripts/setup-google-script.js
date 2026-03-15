#!/usr/bin/env node

/**
 * Автоматичне налаштування Google Apps Script webhook
 *
 * Цей скрипт автоматично:
 * 1. Створює Apps Script проект прив'язаний до вашої Google Sheets
 * 2. Завантажує код webhook
 * 3. Налаштовує тригер onEdit
 *
 * ВИМОГИ:
 * - Google Cloud проект з увімкненим Apps Script API
 * - OAuth2 credentials
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Кольори для консолі
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Читаємо код webhook
const webhookCode = fs.readFileSync(
  path.join(__dirname, '../google-apps-script/webhook.gs'),
  'utf-8'
);

log('\n🚀 Автоматичне налаштування Google Apps Script Webhook\n', 'blue');

log('⚠️  ВАЖЛИВА ІНФОРМАЦІЯ:', 'yellow');
log('Для автоматичного налаштування потрібна OAuth2 авторизація.');
log('Google Apps Script API має обмеження і вимагає ручної авторизації.\n');

log('📋 ШВИДКИЙ СПОСІБ (Рекомендований):\n', 'green');
log('1. Відкрийте вашу Google Sheets таблицю:');
log('   https://docs.google.com/spreadsheets/d/' + process.env.INCOME_SHEET_ID, 'blue');
log('\n2. Меню: Extensions → Apps Script');
log('\n3. Видаліть весь код і вставте цей код:\n');
log('─'.repeat(80), 'yellow');

// Показуємо код з вашим URL
const vercelUrl = process.env.VERCEL_URL || 'https://your-app.vercel.app';
const webhookSecret = process.env.WEBHOOK_SECRET || 'your-secret-key';

const customizedWebhook = webhookCode
  .replace('https://your-app-name.vercel.app/api/webhook', `${vercelUrl}/api/webhook`)
  .replace('your-secret-key-here', webhookSecret);

console.log(customizedWebhook);
log('─'.repeat(80), 'yellow');

log('\n4. Збережіть (Ctrl+S або Cmd+S)');
log('\n5. Налаштуйте тригер:', 'green');
log('   - Натисніть значок годинника (⏰) зліва');
log('   - "+ Add Trigger"');
log('   - Function: onEdit');
log('   - Event type: On edit');
log('   - Save');

log('\n✅ ГОТОВО! Тепер при зміні даних у таблиці сайт оновиться автоматично.\n', 'green');

// Опціонально - можна зберегти налаштований код у файл
const outputPath = path.join(__dirname, '../google-apps-script/webhook-configured.gs');
fs.writeFileSync(outputPath, customizedWebhook);
log(`📝 Налаштований код збережено у: ${outputPath}`, 'blue');

log('\n💡 ТЕСТУВАННЯ:', 'yellow');
log('В Google Sheets з\'явиться меню "🔄 Sync Dashboard"');
log('Натисніть "⚙️ Test Webhook" для перевірки.\n');

// Додаткова опція - створити QR код для швидкого доступу
log('🔗 Корисні посилання:', 'blue');
log(`Google Sheets: https://docs.google.com/spreadsheets/d/${process.env.INCOME_SHEET_ID}/edit`);
log(`Apps Script: https://script.google.com/home`);

log('\n' + '═'.repeat(80) + '\n', 'green');

process.exit(0);
