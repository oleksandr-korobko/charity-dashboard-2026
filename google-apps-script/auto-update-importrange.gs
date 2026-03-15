/**
 * Apps Script для ОСНОВНОГО файлу
 *
 * Автоматично оновлює IMPORTRANGE в публічному файлі
 * при зміні даних в основному файлі
 *
 * НАЛАШТУВАННЯ:
 * 1. Відкрийте ОСНОВНИЙ файл (з особистими даними)
 * 2. Extensions → Apps Script
 * 3. Вставте цей код
 * 4. Збережіть
 * 5. Налаштуйте тригер: onEdit
 */

// ID публічного файлу (куди йде IMPORTRANGE)
const PUBLIC_SHEET_ID = '1FG88K8mutRm6-Z8ZrRgM4gd_rBtZre2LWtdyi6VXckw';
const PUBLIC_SHEET_NAME = 'UA_Yogis';

/**
 * Тригер: Спрацьовує при редагуванні основного файлу
 */
function onEdit(e) {
  try {
    // Перевіряємо чи редагування на потрібному листі
    const sheet = e.source.getActiveSheet();
    if (sheet.getName() !== 'UA_Yogis') {
      return; // Не той лист, виходимо
    }

    Logger.log('📝 Data edited in main file, triggering public file refresh...');

    // Відкриваємо публічний файл
    const publicSpreadsheet = SpreadsheetApp.openById(PUBLIC_SHEET_ID);
    const publicSheet = publicSpreadsheet.getSheetByName(PUBLIC_SHEET_NAME);

    if (!publicSheet) {
      Logger.log('❌ Public sheet not found');
      return;
    }

    // Примусово перераховуємо IMPORTRANGE
    // Спосіб 1: Змінюємо формулу і повертаємо назад
    const formulaCell = publicSheet.getRange('A1');
    const currentFormula = formulaCell.getFormula();

    if (currentFormula && currentFormula.includes('IMPORTRANGE')) {
      // Тимчасово міняємо на пусту клітинку
      formulaCell.setValue('');
      SpreadsheetApp.flush(); // Примусово застосувати зміни

      // Повертаємо формулу назад
      formulaCell.setFormula(currentFormula);
      SpreadsheetApp.flush();

      Logger.log('✅ Public file IMPORTRANGE refreshed successfully');
    } else {
      Logger.log('⚠️ No IMPORTRANGE formula found in A1');
    }

  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}

/**
 * Ручне оновлення (для тестування)
 */
function manualRefresh() {
  try {
    const publicSpreadsheet = SpreadsheetApp.openById(PUBLIC_SHEET_ID);
    const publicSheet = publicSpreadsheet.getSheetByName(PUBLIC_SHEET_NAME);

    const formulaCell = publicSheet.getRange('A1');
    const currentFormula = formulaCell.getFormula();

    Logger.log('Current formula: ' + currentFormula);

    if (currentFormula && currentFormula.includes('IMPORTRANGE')) {
      formulaCell.setValue('');
      SpreadsheetApp.flush();
      Utilities.sleep(1000); // Зачекати 1 секунду

      formulaCell.setFormula(currentFormula);
      SpreadsheetApp.flush();

      Logger.log('✅ Manual refresh completed');
    }
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}

/**
 * Додати меню для ручного оновлення
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 Sync Public Dashboard')
      .addItem('📤 Update Public File Now', 'manualRefresh')
      .addToUi();
}
