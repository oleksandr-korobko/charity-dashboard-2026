# 🚀 Інструкція з деплою на Vercel

## 📋 Передумови

- [x] Проект налаштований локально
- [x] Google Sheets API ключ отриманий
- [x] GitHub акаунт
- [ ] Vercel акаунт (безкоштовний)

---

## Крок 1: Підготовка проекту

### 1.1 Створіть .gitignore (якщо ще немає)

```bash
# Dependencies
node_modules/

# Environment variables
.env
.env.local

# Build output
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

### 1.2 Закомітьте код в Git

```bash
git init
git add .
git commit -m "Initial commit: Financial Dashboard 2026"
```

### 1.3 Створіть репозиторій на GitHub

1. Зайдіть на https://github.com/new
2. Назвіть репозиторій: `charity-dashboard-2026`
3. НЕ додавайте README, .gitignore (вони вже є)
4. Створіть репозиторій

### 1.4 Завантажте код на GitHub

```bash
git remote add origin https://github.com/YOUR-USERNAME/charity-dashboard-2026.git
git branch -M main
git push -u origin main
```

---

## Крок 2: Деплой на Vercel

### 2.1 Створіть акаунт на Vercel

1. Зайдіть на https://vercel.com/signup
2. Увійдіть через GitHub акаунт

### 2.2 Імпортуйте проект

1. Натисніть "Add New Project"
2. Імпортуйте ваш GitHub репозиторій `charity-dashboard-2026`
3. Налаштування:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (залишити як є)
   - **Output Directory**: `dist` (залишити як є)

### 2.3 Додайте змінні середовища (Environment Variables)

Перед деплоєм, додайте ці змінні:

```
GOOGLE_API_KEY=your-google-api-key-here
INCOME_SHEET_ID=your-spreadsheet-id-here
INCOME_SHEET_NAME=UA_Yogis
WEBHOOK_SECRET=ваш-складний-секретний-ключ-тут
```

> ⚠️ **ВАЖЛИВО**: Створіть складний `WEBHOOK_SECRET`. Наприклад: `ua-yogis-2026-secure-webhook-key-XYZ123`

### 2.4 Натисніть "Deploy"

Зачекайте 2-3 хвилини. Vercel автоматично:
- Встановить залежності
- Збудує проект
- Задеплоїть на production

### 2.5 Отримайте URL

Після деплою ви отримаєте URL типу:
```
https://charity-dashboard-2026.vercel.app
```

---

## Крок 3: Налаштування Google Apps Script Webhook

### 3.1 Відкрийте Google Sheets

1. Відкрийте вашу таблицю: https://docs.google.com/spreadsheets/d/1FG88K8mutRm6-Z8ZrRgM4gd_rBtZre2LWtdyi6VXckw
2. Меню: **Розширення (Extensions)** → **Apps Script**

### 3.2 Вставте код webhook

1. Видаліть весь код що там є
2. Відкрийте файл `google-apps-script/webhook.gs` з цього проекту
3. Скопіюйте і вставте код
4. Змініть ці рядки:

```javascript
const WEBHOOK_URL = 'https://charity-dashboard-2026.vercel.app/api/webhook';
const WEBHOOK_SECRET = 'ua-yogis-2026-secure-webhook-key-XYZ123'; // Той самий що в Vercel!
```

### 3.3 Збережіть і налаштуйте тригери

1. Збережіть: **Ctrl+S** або File → Save
2. Дайте назву проекту: "Dashboard Auto-Sync"
3. Меню: **Тригери** (значок годинника зліва)
4. Натисніть "+ Add Trigger"
5. Налаштування:
   - Choose function: `onEdit`
   - Event type: `On edit`
   - Натисніть Save
6. Дозвольте доступ (може попросити авторизацію)

### 3.4 Протестуйте

1. Поверніться до Google Sheets
2. Повинно з'явитися нове меню: **🔄 Sync Dashboard**
3. Натисніть: **⚙️ Test Webhook**
4. Якщо все налаштовано правильно, побачите: "✅ Success"

---

## Крок 4: Перевірка роботи

### 4.1 Відкрийте ваш сайт

```
https://charity-dashboard-2026.vercel.app
```

### 4.2 Тест автоматичного оновлення

1. Відкрийте сайт у браузері
2. Відкрийте Google Sheets в іншій вкладці
3. Змініть будь-яке значення в таблиці (наприклад, суму)
4. Зачекайте 30 секунд
5. Сайт автоматично оновиться! 🎉

### 4.3 Тест ручного оновлення

1. На сайті натисніть кнопку **Refresh**
2. Дані повинні оновитися миттєво

---

## 📊 Як це працює

### Автоматичне оновлення (30 секунд)
```
Браузер → (кожні 30 сек) → /api/data → Google Sheets API → Оновлення даних
```

### Миттєве оновлення через Webhook (опціонально)
```
Google Sheets → (при зміні) → Apps Script → /api/webhook → Тригер оновлення
```

---

## 🔧 Додаткові налаштування

### Змінити інтервал оновлення

Відкрийте `Dashboard.tsx`, рядок 17:

```typescript
const POLLING_INTERVAL = 30000; // 30 секунд (30000 мс)

// Для швидшого оновлення:
const POLLING_INTERVAL = 10000; // 10 секунд

// Для повільнішого:
const POLLING_INTERVAL = 60000; // 1 хвилина
```

### Додати власний домен

1. У Vercel: Settings → Domains
2. Додайте ваш домен (наприклад, `dashboard.ua-yogis.org`)
3. Налаштуйте DNS записи як вказано

### Моніторинг логів

Vercel → Ваш проект → Logs

Тут можна побачити:
- Запити до /api/data
- Webhook події
- Помилки (якщо є)

---

## ❓ Troubleshooting

### Сайт не оновлюється автоматично

1. Перевірте Console у браузері (F12)
2. Шукайте помилки у вкладці Console
3. Перевірте Network → Шукайте запити до `/api/data`

### Webhook не працює

1. Відкрийте Apps Script → Executions
2. Перевірте чи є помилки
3. Перевірте чи `WEBHOOK_SECRET` однаковий у Vercel і Apps Script

### Помилка 401 Unauthorized

`WEBHOOK_SECRET` не співпадає. Перевірте:
- Vercel Environment Variables
- Google Apps Script код

### Помилка з Google API

Перевірте чи:
- Google Sheets API увімкнено у вашому проекті
- API ключ правильний
- Таблиця має публічний доступ або ключ має права

---

## ✅ Готово!

Тепер ваш фінансовий дашборд:
- ✅ Автоматично оновлюється кожні 30 секунд
- ✅ Синхронізується з Google Sheets
- ✅ Доступний онлайн 24/7
- ✅ Має красивий UI з графіками
- ✅ Підтримує 2 мови (UA/EN)
- ✅ Експортує звіти в PDF

🎉 **Вітаю! Проект запущено!**
