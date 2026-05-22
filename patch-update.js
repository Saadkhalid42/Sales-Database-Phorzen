import fs from 'fs';
const file = 'src/store/useStore.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /      updateRecordCell: \(recordId, colKey, value\) => \{\n        get\(\)\.takeSnapshot\(\);\n        set\(\(state\) => \{/;

const replacement = `      updateRecordCell: (recordId, colKey, value) => {
        const state = get();
        const db = state.databases.find(d => d.id === state.activeDatabaseId);
        if (db) {
          const currentRecord = db.records.find(r => r.id === recordId);
          if (currentRecord && currentRecord.cells[colKey] === value) {
            return; // Do nothing if unchanged
          }
        }
        
        get().takeSnapshot();
        set((state) => {`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
