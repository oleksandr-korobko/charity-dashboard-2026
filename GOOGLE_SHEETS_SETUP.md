/**
 * Google Apps Script Webhook для автоматичного оновлення даних на сайті
 *
 * ІНСТРУКЦІЯ З НАЛАШТУВАННЯ:
 * 1. Відкрийте вашу Google Sheets таблицю
 * 2. Меню: Розширення (Extensions) → Apps Script
 * 3. Видаліть весь код і вставте цей файл
 * 4. Змініть WEBHOOK_URL на ваш Vercel URL
 * 5. Змініть WEBHOOK_SECRET на ваш секретний ключ
 * 6. Збережіть (Ctrl+S)
 * 7. Натисніть "Запустити" (Run) → Дозвольте доступ
 */

// НАЛАШТУВАННЯ - ЗМІНІТЬ ЦІ ЗНАЧЕННЯ
const WEBHOOK_URL = 'https://your-app-name.vercel.app/api/webhook';
const WEBHOOK_SECRET = 'your-webhook-secret-here'; // Створіть складний ключ

/**
 * Тригер: Спрацьовує автоматично при будь-якій зміні в таблиці
 */
function onEdit(e) {
  try {
    // Логування для дебагу
    Logger.log('Sheet edited, sending webhook...');

    // Надсилаємо POST запит на webhook
    var options = {
      'method': 'post',
      'headers': {
        'x-webhook-secret': WEBHOOK_SECRET,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify({
        'timestamp': new Date().toISOString(),
        'sheet': e.source.getName(),
        'range': e.range.getA1Notation()
      }),
      'muteHttpExceptions': true
    };

    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log('✅ Webhook sent successfully');
    } else {
      Logger.log('⚠️ Webhook failed with code: ' + responseCode);
    }

  } catch (error) {
    Logger.log('❌ Error sending webhook: ' + error.toString());
  }
}

/**
 * Тригер: Спрацьовує при відкритті таблиці (для тестування)
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 Sync Dashboard')
      .addItem('📤 Send Update Now', 'manualSync')
      .addItem('⚙️ Test Webhook', 'testWebhook')
      .addToUi();
}

/**
 * Функція для ручного оновлення (через меню)
 */
function manualSync() {
  var ui = SpreadsheetApp.getUi();

  try {
    var options = {
      'method': 'post',
      'headers': {
        'x-webhook-secret': WEBHOOK_SECRET,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify({
        'timestamp': new Date().toISOString(),
        'manual': true
      }),
      'muteHttpExceptions': true
    };

    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var responseCode = response.getResponseCode();

    if (responseCode === 200) {
      ui.alert('✅ Success', 'Dashboard updated successfully!', ui.ButtonSet.OK);
    } else {
      ui.alert('⚠️ Warning', 'Webhook responded with code: ' + responseCode, ui.ButtonSet.OK);
    }

  } catch (error) {
    ui.alert('❌ Error', 'Failed to send webhook: ' + error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Тестування з'єднання
 */
function testWebhook() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    '🧪 Test Configuration',
    'Webhook URL: ' + WEBHOOK_URL + '

Продовжити тест?',
    ui.ButtonSet.YES_NO
  );

  if (result == ui.Button.YES) {
    manualSync();
  }
}





# Налаштування Google Sheets API

Це покрокова інструкція для отримання API ключа Google та налаштування автоматичного парсингу даних з Google Sheets.

## Крок 1: Створення проекту в Google Cloud Console

1. Перейдіть на [Google Cloud Console](https://console.cloud.google.com/)
2. Увійдіть за допомогою свого Google акаунту
3. Натисніть на випадаючий список проектів у верхній панелі
4. Натисніть **"New Project"** (Новий проект)
5. Введіть назву проекту, наприклад: `Financial Dashboard 2026`
6. Натисніть **"Create"** (Створити)

## Крок 2: Увімкнення Google Sheets API

1. У лівому меню оберіть **"APIs & Services"** → **"Library"**
2. У пошуку введіть: `Google Sheets API`
3. Натисніть на **"Google Sheets API"**
4. Натисніть кнопку **"Enable"** (Увімкнути)

## Крок 3: Створення API ключа

1. У лівому меню оберіть **"APIs & Services"** → **"Credentials"** (Облікові дані)
2. Натисніть **"Create Credentials"** → **"API Key"**
3. Ваш API ключ буде створено і показано у спливаючому вікні
4. **Скопіюйте цей ключ** - він вам знадобиться
5. (Опціонально) Натисніть **"Restrict Key"** для обмеження використання:
   - У розділі **"API restrictions"** оберіть **"Restrict key"**
   - Виберіть **"Google Sheets API"** зі списку
   - Натисніть **"Save"**

## Крок 4: Налаштування доступу до Google Sheets

### Для таблиці з надходженнями:
1. Відкрийте вашу Google Sheets таблицю з надходженнями
2. Натисніть кнопку **"Share"** (Поділитися) у верхньому правому куті
3. У розділі **"General access"** оберіть **"Anyone with the link"**
4. Переконайтесь що обрано **"Viewer"** (Переглядач)
5. Натисніть **"Done"**

### Для таблиці з витратами (коли буде готова):
Повторіть ті ж самі кроки

## Крок 5: Налаштування проекту

1. Створіть файл `.env` у корені проекту (поруч з `package.json`)
2. Скопіюйте вміст з `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Відкрийте `.env` та вставте ваш API ключ:
   ```env
   GOOGLE_API_KEY=ваш_ключ_тут

   INCOME_SHEET_ID=1FG88K8mutRm6-Z8ZrRgM4gd_rBtZre2LWtdyi6VXckw
   INCOME_SHEET_NAME=UA_Yogis

   # Коли будете готові додати витрати:
   EXPENSES_SHEET_ID=
   EXPENSES_SHEET_NAME=
   ```

## Крок 6: Тестування

1. Запустіть скрипт для завантаження даних:
   ```bash
   npm run fetch-data
   ```

2. Якщо все налаштовано правильно, ви побачите:
   ```
   Fetching income data from sheet: 1FG88K8mutRm6-Z8ZrRgM4gd_rBtZre2LWtdyi6VXckw...
   Successfully fetched X income records.
   Total Income USD: $XXX.XX
   Total Income EUR: €XXX.XX

   ✓ Data successfully saved to: /path/to/data/financial-data-2026.json
   ```

## Структура даних

Після успішного парсингу, файл `data/financial-data-2026.json` міститиме:

```json
{
  "income": [
    {
      "id": "1",
      "date": "16.02.2026",
      "paidUSD": 5.69,
      "paidEUR": 0,
      "type": "income"
    }
  ],
  "expenses": [],
  "summary": {
    "totalIncomeUSD": 1800.91,
    "totalIncomeEUR": 1075.96,
    "totalExpensesUSD": 0,
    "totalExpensesEUR": 0,
    "balanceUSD": 1800.91,
    "balanceEUR": 1075.96,
    "lastUpdated": "2026-03-15T12:00:00.000Z"
  }
}
```

## Автоматичне оновлення даних

Для оновлення даних з Google Sheets просто запустіть:
```bash
npm run fetch-data
```

Це можна налаштувати для автоматичного запуску:
- При деплої на Vercel (через GitHub Actions)
- За розкладом (cron job)
- При кожному запуску dev сервера

## Додавання таблиці з витратами

Коли у вас буде готова таблиця з витратами:

1. Отримайте ID таблиці з URL (частина між `/d/` та `/edit`)
2. Додайте в `.env`:
   ```env
   EXPENSES_SHEET_ID=your_expenses_sheet_id
   EXPENSES_SHEET_NAME=Sheet1
   ```
3. Зробіть таблицю публічною (як описано у Кроці 4)
4. Запустіть `npm run fetch-data`

## Усунення проблем

### Помилка: "GOOGLE_API_KEY not found"
- Переконайтесь що файл `.env` створено у корені проекту
- Перевірте що API ключ правильно вставлено без пробілів

### Помилка: "API key not valid"
- Перевірте що ви увімкнули Google Sheets API
- Перевірте обмеження API ключа (має бути дозволено Google Sheets API)

### Помилка: "The caller does not have permission"
- Переконайтесь що таблиці зроблені публічними ("Anyone with the link" can view)

### Помилка: "Unable to parse range"
- Перевірте що назва аркуша правильна (INCOME_SHEET_NAME, EXPENSES_SHEET_NAME)
- Назва має точно відповідати назві вкладки у Google Sheets

## Безпека

- **НЕ** додавайте `.env` файл до git (він вже в `.gitignore`)
- API ключ має обмеження лише на Google Sheets API
- Таблиці публічні, але дані вже очищені від особистої інформації
- Для продакшн середовища використовуйте environment variables на хостингу (Vercel, Netlify, etc.)
