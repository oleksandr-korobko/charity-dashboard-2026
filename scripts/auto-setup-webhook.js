#!/usr/bin/env node

/**
 * ПОВНІСТЮ АВТОМАТИЧНЕ налаштування Google Apps Script
 *
 * Цей скрипт:
 * 1. Використовує Google Sheets API для створення bound script
 * 2. Автоматично завантажує код webhook
 * 3. Деплоїть його
 *
 * Запуск: node scripts/auto-setup-webhook.js
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import http from 'http';
import { URL } from 'url';
import open from 'open';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/drive.file',
];

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

// Ці credentials можуть бути створені в Google Cloud Console
// Для публічного використання створюємо OAuth client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

console.log('\n🚀 Автоматичне налаштування Google Apps Script Webhook\n');

// Перевірка чи є необхідні credentials
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.log('⚠️  Для автоматичного налаштування потрібні OAuth2 credentials.\n');
  console.log('Створіть їх на: https://console.cloud.google.com/apis/credentials\n');
  console.log('1. Create Credentials → OAuth client ID');
  console.log('2. Application type: Web application');
  console.log('3. Authorized redirect URIs: http://localhost:3000/oauth2callback');
  console.log('4. Додайте у .env:');
  console.log('   GOOGLE_CLIENT_ID=your-client-id');
  console.log('   GOOGLE_CLIENT_SECRET=your-client-secret\n');

  console.log('━'.repeat(80));
  console.log('\n💡 АБО використайте простий метод:\n');
  console.log('Запустіть: node scripts/setup-google-script.js');
  console.log('(показує готовий код для копіювання в Apps Script)\n');

  process.exit(1);
}

// Функція для авторизації
async function authorize() {
  return new Promise((resolve, reject) => {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    // Створюємо локальний сервер для отримання callback
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${PORT}`);

        if (url.pathname === '/oauth2callback') {
          const code = url.searchParams.get('code');

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <body style="font-family: Arial; padding: 50px; text-align: center;">
                <h1>✅ Авторизація успішна!</h1>
                <p>Можете закрити це вікно.</p>
                <p>Скрипт продовжує роботу в терміналі...</p>
              </body>
            </html>
          `);

          server.close();

          // Отримуємо токен
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);

          console.log('\n✅ Авторизація успішна!');
          resolve(oauth2Client);
        }
      } catch (error) {
        reject(error);
      }
    });

    server.listen(PORT, () => {
      console.log('🔐 Відкриваю браузер для авторизації...\n');
      console.log('Якщо браузер не відкрився, перейдіть за посиланням:');
      console.log(authorizeUrl + '\n');

      // Відкриваємо браузер
      open(authorizeUrl).catch(() => {
        console.log('⚠️  Не вдалося відкрити браузер автоматично.');
      });
    });
  });
}

// Головна функція
async function main() {
  try {
    // Авторизація
    const auth = await authorize();

    console.log('\n📝 Створюю Apps Script проект...');

    const script = google.script({ version: 'v1', auth });

    // Читаємо код webhook
    const webhookCode = fs.readFileSync(
      path.join(__dirname, '../google-apps-script/webhook.gs'),
      'utf-8'
    );

    // Налаштовуємо URL та secret
    const vercelUrl = process.env.VERCEL_URL || 'https://your-app.vercel.app';
    const webhookSecret = process.env.WEBHOOK_SECRET || 'generate-secret-key';

    const customizedCode = webhookCode
      .replace('https://your-app-name.vercel.app/api/webhook', `${vercelUrl}/api/webhook`)
      .replace('your-secret-key-here', webhookSecret);

    // Створюємо новий проект прив'язаний до Sheets
    const createResponse = await script.projects.create({
      requestBody: {
        title: 'Dashboard Webhook Auto-Sync',
        parentId: process.env.INCOME_SHEET_ID,
      },
    });

    const scriptId = createResponse.data.scriptId;
    console.log(`✅ Проект створено: ${scriptId}`);

    // Завантажуємо код
    console.log('\n📤 Завантажую код webhook...');

    await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: {
        files: [
          {
            name: 'webhook',
            type: 'SERVER_JS',
            source: customizedCode,
          },
        ],
      },
    });

    console.log('✅ Код завантажено!');

    // Створюємо deployment
    console.log('\n🚀 Деплою скрипт...');

    const deployment = await script.projects.deployments.create({
      scriptId: scriptId,
      requestBody: {
        versionNumber: 1,
        description: 'Auto-deployed webhook',
      },
    });

    console.log('✅ Скрипт задеплоєно!');

    console.log('\n' + '═'.repeat(80));
    console.log('\n🎉 ВСЕ ГОТОВО!\n');
    console.log('Тепер потрібно налаштувати тригер:');
    console.log('\n1. Відкрийте Apps Script:');
    console.log(`   https://script.google.com/d/${scriptId}/edit`);
    console.log('\n2. Налаштуйте тригер (значок ⏰):');
    console.log('   - Function: onEdit');
    console.log('   - Event type: On edit');
    console.log('\n3. Збережіть');
    console.log('\n✅ Готово! При зміні даних у таблиці сайт оновиться автоматично.\n');

  } catch (error) {
    console.error('\n❌ Помилка:', error.message);

    if (error.code === 404) {
      console.log('\n💡 Apps Script API не увімкнений.');
      console.log('Увімкніть на: https://console.cloud.google.com/apis/library/script.googleapis.com');
    }

    process.exit(1);
  }
}

main();
