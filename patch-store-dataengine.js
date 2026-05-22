import fs from 'fs';
const file = 'src/store/useStore.ts';
let code = fs.readFileSync(file, 'utf8');

// Ensure import is there
if (!code.includes('import { analyzeDateColumn, parseDate, parseNumber, parseBoolean, extractSelectOptions, convertValue } from \'../utils/DataEngine\';')) {
  code = code.replace(
    /import { create } from 'zustand';/,
    `import { create } from 'zustand';\nimport { analyzeDateColumn, extractSelectOptions, convertValue } from '../utils/DataEngine';`
  );
}

// Replace the changeColumnType implementation block
const overrideRegex = /changeColumnType: \(colKey, newType, newTypeOptions\) => set\(\(state\) => \{[\s\S]*?return \{ \.\.\.db, columns: newCols, records: newRecords \};\n          \}\)/;

const newImplementation = `changeColumnType: (colKey, newType, newTypeOptions) => set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            
            const colIndex = db.columns.findIndex(c => c.key === colKey);
            if (colIndex === -1) return db;
            
            const oldCol = db.columns[colIndex];
            if (oldCol.type === newType) {
                if (newTypeOptions) {
                    const newCols = [...db.columns];
                    newCols[colIndex] = { ...oldCol, typeOptions: newTypeOptions };
                    return { ...db, columns: newCols };
                }
                return db;
            }

            let finalTypeOptions = newTypeOptions || {};
            
            // Extract options for selects
            if ((newType === 'single_select' || newType === 'multiple_select') && (!finalTypeOptions.options || finalTypeOptions.options.length === 0)) {
                const allValues = db.records.map(r => r.cells[colKey]);
                finalTypeOptions.options = extractSelectOptions(allValues);
            }
            
            // Clear options if reverting
            if (newType === 'single_line_text' || newType === 'long_text') {
                delete finalTypeOptions.options;
            }

            const newCols = [...db.columns];
            newCols[colIndex] = { ...oldCol, type: newType, typeOptions: finalTypeOptions };
            
            // Pre-calculate date context if we are parsing dates
            let dateContext = 'MDY';
            if (newType === 'date') {
                dateContext = analyzeDateColumn(db.records.map(r => r.cells[colKey]));
            }
            
            const newRecords = db.records.map(r => {
                const cells = { ...r.cells };
                const rawValue = cells[colKey];
                
                // Use Data Engine
                const { value, isFlagged } = convertValue(rawValue, newType, dateContext as any);
                cells[colKey] = value;
                
                // Track flagged state
                const newFlagged = { ...(r._flagged || {}) };
                if (isFlagged) {
                    newFlagged[colKey] = true;
                    // Retain the raw unparseable value under a special key so it's not destroyed
                    cells[\`_raw_\${colKey}\`] = rawValue;
                } else {
                    delete newFlagged[colKey];
                    delete cells[\`_raw_\${colKey}\`];
                }

                return { ...r, cells, _flagged: newFlagged };
            });

            return { ...db, columns: newCols, records: newRecords };
          })`;

code = code.replace(overrideRegex, newImplementation);

fs.writeFileSync(file, code);
