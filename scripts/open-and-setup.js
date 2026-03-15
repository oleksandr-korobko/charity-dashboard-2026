#!/usr/bin/env node

/**
 * НАЙПРОСТІШИЙ СПОСІБ: Відкрити Google Sheets і показати готовий код
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHEET_ID = process.env.INCOME_SHEET_ID;
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
const APPS_SCRIPT_URL = `https://script.google.com/home/projects/create?template=spreadsheet&scriptId=${SHEET_ID}`;

console.log('\n🚀 Автоматичне відкриття Google Sheets\n');

// Читаємо готовий код
const webhookCode = fs.readFileSync(
  path.join(__dirname, '../google-apps-script/webhook-configured.gs'),
  'utf-8'
);

// Копіюємо код в буфер обміну (якщо можливо)
try {
  const platform = process.platform;
  const copyCommand =
    platform === 'darwin' ? 'pbcopy' :
    platform === 'win32' ? 'clip' : 'xclip';

  exec(`echo "${webhookCode.replace(/"/g, '\\"')}" | ${copyCommand}`, (error) => {
    if (!error) {
      console.log('✅ Код скопійовано в буфер обміну!\n');
    }
  });
} catch (e) {
  console.log('⚠️  Не вдалося скопіювати в буфер обміну\n');
}

console.log('📋 ІНСТРУКЦІЯ (3 кроки):\n');
console.log('1️⃣  Відкриваю Google Sheets у браузері...');
console.log(`   ${SHEET_URL}\n`);

console.log('2️⃣  У Google Sheets:');
console.log('   → Меню: Extensions → Apps Script');
console.log('   → Видаліть весь код');
console.log('   → Вставте код (Ctrl+V або Cmd+V)');
console.log('   → Збережіть (Ctrl+S)\n');

console.log('3️⃣  Налаштуйте тригер:');
console.log('   → Значок годинника ⏰ зліва');
console.log('   → "+ Add Trigger"');
console.log('   → Function: onEdit');
console.log('   → Event type: On edit');
console.log('   → Save\n');

console.log('🔑 ВАЖЛИВО:');
console.log(`   Ваш WEBHOOK_SECRET: ${process.env.WEBHOOK_SECRET}`);
console.log('   (вже вставлено в код)\n');

console.log('─'.repeat(80));
console.log('\n💾 Готовий код також збережено у файлі:');
console.log('   google-apps-script/webhook-configured.gs\n');

console.log('🎯 ПІСЛЯ ДЕПЛОЮ НА VERCEL:');
console.log('   Замініть у коді WEBHOOK_URL на ваш Vercel URL\n');

// Відкриваємо браузер
const open = (url) => {
  const start =
    process.platform == 'darwin' ? 'open' :
    process.platform == 'win32' ? 'start' : 'xdg-open';

  exec(`${start} ${url}`, (error) => {
    if (error) {
      console.log(`⚠️  Відкрийте вручну: ${url}`);
    } else {
      console.log('✅ Браузер відкрито!\n');
    }
  });
};

setTimeout(() => {
  open(SHEET_URL);
}, 1000);

console.log('═'.repeat(80));
console.log('\n✨ Готово! Слідуйте інструкціям вище.\n');
