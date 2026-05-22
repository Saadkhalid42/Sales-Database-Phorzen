import fs from 'fs';
const file = 'src/store/useStore.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /updateColumn: \(key: string, updates: Partial<GridColumn>\) => void;/,
  `updateColumn: (key: string, updates: Partial<GridColumn>) => void;\n  changeColumnType: (colKey: string, newType: string, newTypeOptions?: any) => void;`
);

const changeColumnTypeCode = `
      changeColumnType: (colKey, newType, newTypeOptions) => set((state) => {
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
            
            // Generate options automatically if converting to select/multi-select and none exist
            if ((newType === 'single_select' || newType === 'multiple_select') && (!finalTypeOptions.options || finalTypeOptions.options.length === 0)) {
                const allValues = db.records.map(r => {
                    const v = r.cells[colKey];
                    if (Array.isArray(v)) return v;
                    return [v];
                }).flat();
                
                const uniqueVals = Array.from(new Set(allValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '')));
                const PASTEL_COLORS = ['#cbd5e1', '#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#6ee7b7', '#93c5fd', '#c4b5fd', '#f0abfc', '#fda4af'];
                
                finalTypeOptions.options = uniqueVals.map((val, idx) => ({
                    label: String(val),
                    color: PASTEL_COLORS[idx % PASTEL_COLORS.length]
                }));
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
          })
        };
      }),
      updateColumn:`;

code = code.replace(
  /updateColumn:/,
  changeColumnTypeCode
);

fs.writeFileSync(file, code);
