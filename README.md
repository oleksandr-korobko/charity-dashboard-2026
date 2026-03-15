# 💰 Financial Dashboard 2026 - Ukrainian Yogis Support

> Автоматичний фінансовий дашборд для відстеження надходжень та витрат програми підтримки українських йогів у 2026 році.

## 🌟 Особливості

- 📊 **Візуалізація даних** - Красиві графіки та діаграми
- 🔄 **Автоматична синхронізація** - Оновлення кожні 30 секунд з Google Sheets
- 🌐 **Двомовність** - Українська та Англійська мови
- 💱 **Мультивалютність** - USD та EUR окремо без конвертації
- 📱 **Адаптивний дизайн** - Працює на всіх пристроях
- 📄 **Експорт PDF** - Збереження звітів одним кліком
- ⚡ **Real-time оновлення** - Webhook для миттєвого оновлення

## 🚀 Швидкий старт

### Локальна розробка

```bash
# Встановіть залежності
npm install

# Створіть .env файл
cp .env.example .env

# Додайте ваші ключі в .env
GOOGLE_API_KEY=your-key-here
INCOME_SHEET_ID=your-sheet-id
INCOME_SHEET_NAME=sheet-name

# Запустіть dev сервер
npm run dev
```

Сайт буде доступний на http://localhost:5173

### Оновлення даних з Google Sheets

```bash
npm run fetch-data
```

## 📦 Структура проекту

```
SY-FH-2026/
├── api/                          # Vercel Serverless Functions
│   ├── data.js                   # API endpoint для отримання даних
│   └── webhook.js                # Webhook для Google Apps Script
├── Components/                   # React компоненти
│   ├── SummaryCards.tsx          # Картки зведення
│   ├── IncomeVsExpensesChart.tsx # Графік доходів vs витрат
│   ├── FinancialDynamicsChart.tsx# Динаміка змін
│   ├── TransactionsTable.tsx     # Таблиця транзакцій
│   └── LanguageToggle.tsx        # Перемикач мови
├── data/                         # JSON дані
│   └── financial-data-2026.json  # Локальна копія даних
├── google-apps-script/           # Скрипти для Google Sheets
│   └── webhook.gs                # Автоматичний webhook
├── scripts/                      # Допоміжні скрипти
│   └── fetch_google_sheets.js    # Отримання даних з API
├── src/
│   ├── components/ui/            # UI компоненти
│   ├── contexts/                 # React Context (мова)
│   ├── types/                    # TypeScript типи
│   └── lib/                      # Утиліти
├── Dashboard.tsx                 # Головний компонент
├── vercel.json                   # Конфігурація Vercel
└── DEPLOYMENT.md                 # Інструкція з деплою
```

## 🔧 Технології

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **PDF Export**: html2canvas + jsPDF
- **Backend**: Vercel Serverless Functions
- **Data Source**: Google Sheets API
- **Auto-sync**: Google Apps Script Webhooks

## 📊 Джерело даних

Дані автоматично завантажуються з Google Sheets:
- **Таблиця**: [UA Yogis Income/Expenses 2026](https://docs.google.com/spreadsheets/d/1FG88K8mutRm6-Z8ZrRgM4gd_rBtZre2LWtdyi6VXckw)
- **Лист**: UA_Yogis
- **Частота оновлення**: Кожні 30 секунд

### Формат даних

#### Надходження (Income):
- Колонка A: ID йога
- Колонка B: Дата (DD-MMM-YYYY)
- Колонка C: Сума USD
- Колонка D: Сума EUR

#### Витрати (Expenses):
- TODO: Буде додано пізніше

## 🌍 Деплой на Vercel

Дивіться детальну інструкцію в [DEPLOYMENT.md](./DEPLOYMENT.md)

**Короткі кроки:**

1. Push код на GitHub
2. Імпортуйте проект у Vercel
3. Додайте Environment Variables
4. Налаштуйте Google Apps Script webhook
5. Готово! 🎉

## 📱 Функціонал

### 1. Автоматичне оновлення (Polling)
- Браузер автоматично перевіряє оновлення кожні 30 секунд
- Працює навіть якщо сторінка вже відкрита
- Оновлює тільки при зміні `lastUpdated`

### 2. Ручне оновлення
- Кнопка **Refresh** для миттєвого оновлення
- У development режимі - перезавантажує сторінку
- У production - отримує дані з /api/data

### 3. Webhook (опціонально)
- Google Sheets → Apps Script → Vercel webhook
- Миттєве оновлення при зміні даних
- Захищено секретним ключем

### 4. Візуалізація
- **Summary Cards**: Загальна статистика (Income, Expenses, Balance)
- **Bar Chart**: Порівняння доходів і витрат
- **Line Chart**: Динаміка по місяцях
- **Transactions Table**: Список усіх транзакцій

### 5. Експорт
- Збереження звіту в PDF
- Включає всі графіки та картки
- Автоматична назва файлу з датою

## 🔐 Безпека

- ✅ API ключі зберігаються в Environment Variables
- ✅ Webhook захищено секретним ключем
- ✅ .env файли не потрапляють у Git
- ✅ CORS налаштований для API endpoints
- ✅ Serverless functions мають timeout

## 🐛 Troubleshooting

### Сайт не оновлюється

1. Відкрийте Console (F12)
2. Перевірте Network → шукайте запити до `/api/data`
3. Перевірте чи є помилки

### Webhook не працює

1. Apps Script → Executions → перевірте помилки
2. Перевірте `WEBHOOK_SECRET` у Vercel і Apps Script
3. Перевірте URL webhook

### Помилка Google API

1. Перевірте чи API ключ правильний
2. Перевірте чи Google Sheets API увімкнено
3. Перевірте права доступу до таблиці

## 📝 Розробка

### Локальне тестування

```bash
# Dev сервер
npm run dev

# Build для production
npm run build

# Preview production build
npm run preview

# Оновити дані з Google Sheets
npm run fetch-data
```

### Додавання нових компонентів

1. Створіть компонент у `Components/`
2. Додайте TypeScript типи у `src/types/`
3. Додайте переклади у `src/contexts/LanguageContext.tsx`
4. Імпортуйте в `Dashboard.tsx`

## 📄 Ліцензія

MIT License - використовуйте вільно для благодійних проектів.

## 🙏 Подяка

Цей проект створено для підтримки українських йогів у 2026 році.

**Financial Support for Ukrainian Yogis** 💙💛

---

**Версія**: 1.0.0
**Останнє оновлення**: Березень 2026
**Розробник**: Oleksandr Korobko
