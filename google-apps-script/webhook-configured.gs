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
    'Webhook URL: ' + WEBHOOK_URL + '\n\nПродовжити тест?',
    ui.ButtonSet.YES_NO
  );

  if (result == ui.Button.YES) {
    manualSync();
  }
}
