import fs from 'fs';
const file = 'src/store/useStore.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /changeColumnType: \(colKey, newType, newTypeOptions\) => set\(\(state\) => \{[\s\S]*?return \{ \.\.\.db, columns: newCols, records: newRecords \};\n          \}\)/,
`changeColumnType: (colKey, newType, newTypeOptions) => set((state) => {
        if (!state.activeDatabaseId) return state;
        return {
          databases: state.databases.map(db => {
            if (db.id !== state.activeDatabaseId) return db;
            
            const colIndex = db.columns.findIndex(c => c.key === colKey);
            if (colIndex === -1) return db;
            
            const oldCol = db.columns[colIndex];
            if (oldCol.type === newType) {
                // Just update typeOptions if the type is the same
                if (newTypeOptions) {
                    const newCols = [...db.columns];
                    newCols[colIndex] = { ...oldCol, typeOptions: newTypeOptions };
                    return { ...db, columns: newCols };
                }
                return db;
            }

            let finalTypeOptions = newTypeOptions || {};
            
            // Generate options automatically if converting to select/multi-select
            if ((newType === 'single_select' || newType === 'multiple_select') && (!finalTypeOptions.options || finalTypeOptions.options.length === 0)) {
                // 1. Extract all non-empty values for this column
                const allValues = db.records.map(r => r.cells[colKey]).filter(val => val !== null && val !== undefined && val !== '');

                // 2. Flatten arrays if converting from something else, and get unique strings
                const uniqueStrings = Array.from(new Set(allValues.flat().map(String)));

                // 3. Generate the options schema
                const generatedOptions = uniqueStrings.map((val, index) => ({
                  id: \`opt_\${Date.now()}_\${index}\`,
                  label: val,
                  color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' // Generic fallback color
                }));

                // 4. Apply to the column schema
                finalTypeOptions.options = generatedOptions;
            }
            
            // Reversal: When switching from select to text, clear options
            if (newType === 'single_line_text' || newType === 'long_text') {
                delete finalTypeOptions.options;
            }

            const newCols = [...db.columns];
            newCols[colIndex] = { ...oldCol, type: newType, typeOptions: finalTypeOptions };
            
            // Map over ALL records to deeply parse and transform the values
            const newRecords = db.records.map(r => {
                const cells = { ...r.cells };
                const rawValue = cells[colKey];
                if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
                    if (newType === 'date') {
                        const rawStr = String(rawValue);
                        const parts = rawStr.split('/');
                        if (parts.length >= 3) {
                            // Assumes DD/MM/YYYY
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2].split(' ')[0], 10);
                            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                cells[colKey] = new Date(year, month, day).toISOString();
                            } else {
                                const parsed = new Date(rawStr);
                                cells[colKey] = !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
                            }
                        } else {
                            const parsed = new Date(rawStr);
                            cells[colKey] = !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
                        }
                    } else if (newType === 'single_select') {
                        if (Array.isArray(rawValue)) {
                            cells[colKey] = rawValue.length > 0 ? String(rawValue[0]) : null;
                        } else {
                            cells[colKey] = String(rawValue);
                        }
                    } else if (newType === 'multiple_select') {
                        if (!Array.isArray(rawValue)) {
                            cells[colKey] = String(rawValue).split(',').map(s => s.trim()).filter(Boolean);
                        }
                    } else if (newType === 'number') {
                        const parsed = parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
                        cells[colKey] = !isNaN(parsed) ? parsed : null;
                    } else if (newType === 'boolean') {
                        const s = String(rawValue).toLowerCase().trim();
                        cells[colKey] = (s === 'true' || s === 'yes' || s === '1' || s === 'y');
                    } else if (newType === 'single_line_text' || newType === 'long_text') {
                        if (Array.isArray(rawValue)) {
                            cells[colKey] = rawValue.join(', ');
                        } else {
                            cells[colKey] = String(rawValue);
                        }
                    }
                }
                return { ...r, cells };
            });

            return { ...db, columns: newCols, records: newRecords };
          })`
);

fs.writeFileSync(file, code);
