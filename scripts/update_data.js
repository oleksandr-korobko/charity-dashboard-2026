import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../UA_Yogis_MonoCard-Таблиця 1.csv');
const jsonPath = path.join(__dirname, '../data/data.json');

const csvContent = fs.readFileSync(csvPath, 'utf8');

const monthMap = {
    'січ': 'Jan', 'лют': 'Feb', 'бер': 'Mar', 'квіт': 'Apr',
    'трав': 'May', 'черв': 'Jun', 'лип': 'Jul', 'серп': 'Aug',
    'вер': 'Sep', 'жовт': 'Oct', 'лист': 'Nov', 'груд': 'Dec'
};

function parseDate(str) {
    if (!str) return "";
    let clean = str.trim();
    // Handle numeric dates like 26.07.2023 or 26-07-2023
    if (/^\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{4}$/.test(clean)) {
        return clean.replace(/\./g, '-'); // Standardize to dashes for dayjs
    }
    
    // Handle dates with Ukrainian month names
    for (const [ua, en] of Object.entries(monthMap)) {
        if (clean.includes(ua)) {
            // Replace "трав." or "трав" with "May"
            const regex = new RegExp(ua + '\\.?', 'i');
            clean = clean.replace(regex, en);
            break;
        }
    }
    
    // Final cleanup: standardized dashes and remove any remaining dots that are NOT separators
    return clean.replace(/\./g, '').replace(/[\s\xa0]/g, '');
}

function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const row = [];
        let inQuotes = false;
        let currentValue = '';
        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ';' && !inQuotes) {
                row.push(currentValue);
                currentValue = '';
            } else currentValue += char;
        }
        row.push(currentValue);
        result.push(row);
    }
    return result;
}

const parseCurrency = (str) => {
    if (!str) return 0;
    // Remove symbols, words, and ALL types of spaces (including non-breaking \xa0)
    let clean = str.replace(/[грн\.€євро₴\s\xa0]/g, '');
    
    // Convert comma to dot if it exists (for European formatting 7 000,00)
    clean = clean.replace(',', '.');
    
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
};

const csvRows = parseCSV(csvContent);

const synchronizedData = [];
let skippedCount = 0;

csvRows.forEach((row, index) => {
    const eur = parseCurrency(row[4]);
    const uah = parseCurrency(row[5]);
    const hasValue = eur > 0 || uah > 0;
    const hasIdentity = row[0] || row[1] || row[2] || row[6]; // ID, City, Payments, or Category

    // Include if it has a money value and some descriptive info
    // Exclude sub-total rows (e.g., rows where City column contains "EUR" or "₴")
    const city = (row[1] || "").trim();
    const isSubTotal = city.includes('EUR') || city.includes('₴') || city === 'Сума Евро';

    if (hasValue && hasIdentity && !isSubTotal) {
        synchronizedData.push({
            "City": city || "Інші",
            "Date": parseDate(row[3] || ""),
            "Paid EUR": eur,
            "Category": row[6] || "",
            "Paid UAH": uah
        });
    } else {
        skippedCount++;
    }
});

fs.writeFileSync(jsonPath, JSON.stringify(synchronizedData, null, 2));

const totalUah = synchronizedData.reduce((sum, item) => sum + (item["Paid UAH"] || 0), 0);
const totalEur = synchronizedData.reduce((sum, item) => sum + (item["Paid EUR"] || 0), 0);

console.log(`Successfully synchronized ${synchronizedData.length} records.`);
console.log(`Total UAH: ${totalUah.toFixed(2)}`);
console.log(`Total EUR: ${totalEur.toFixed(2)}`);
