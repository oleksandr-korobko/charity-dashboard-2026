import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../Зведена таблиця Financial Help for Ukrainian Yogis.xlsx - UA_Yogis_MonoCard (2).csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

const parseCurrency = (str) => {
    if (!str) return 0;
    
    // Remove quotes
    const raw = str.replace(/"/g, '').trim();

    // Check if it has "грн." prefix - usually implies comma is thousand separator
    if (raw.includes('грн.')) {
         // "грн.7,000" -> 7000
         const clean = raw.replace(/грн\./g, '').replace(/,/g, '');
         const float = parseFloat(clean);
         console.log(`Type: Prefix, Original: "${str}", Clean: "${clean}", Float: ${float}`);
         return float;
    } else {
        // "15000,31" -> comma is decimal
        const clean = raw.replace(/,/g, '.').replace(/[^0-9.]/g, '');
        const float = parseFloat(clean);
        console.log(`Type: No-Prefix, Original: "${str}", Clean: "${clean}", Float: ${float}`);
        return float;
    }
};

// Test with a few known problematic lines
const lines = csvContent.split('\n');
console.log("Testing specific lines:");

const testLineIndices = [3, 12, 110, 48, 620]; // Added 48 (comma decimal), 620 (summary line?) 

testLineIndices.forEach(idx => {
    // CSV line index matches array index if we split by newline
    // But line numbers in editor are 1-based.
    // Line 3 in editor is index 2 in array.
    const line = lines[idx - 1]; 
    if (line) {
        console.log(`\nLine ${idx}: ${line}`);
        // Extract the UAH part. It's usually the 6th column (index 5) but inside quotes
        // Quick extraction for debug: look for "грн."
        const match = line.match(/"грн\.[^"]+"/);
        if (match) {
            parseCurrency(match[0]);
        }
    }
});
