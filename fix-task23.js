import fs from 'fs';
const file = 'src/components/Toolbar/CSVImportWizard.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /\/\/ 2\. Insert records pre-parsed[\s\S]*?onOpenChange\(false\);/g;

const replacement = `// 2. Insert records pre-parsed to fix the React batching / empty date bug
    const newRecordsList: any[] = [];
    csvData.forEach((row, idx) => {
        const cells: Record<string, any> = {};
        const flagged: Record<string, boolean> = {};

        mappings.forEach(m => {
            const rawVal = row[m.csvHeader];
            const targetKey = m.targetFieldId === 'CREATE_NEW' ? newKeysMap[m.csvHeader] : m.targetFieldId;
            
            const { value, isFlagged } = convertValue(rawVal, m.targetType, dateContexts[targetKey] || 'MDY');
            cells[targetKey] = value;
            if (isFlagged) {
                flagged[targetKey] = true;
                cells[\`_raw_\${targetKey}\`] = rawVal;
            }
        });

        const newRec = {
            id: \`rec_import_\${Date.now()}_\${idx}\`,
            cells,
            _flagged: Object.keys(flagged).length > 0 ? flagged : undefined
        };
        newRecordsList.push(newRec);
        addRecord(newRec);
    });

    // 3. Fix CSV Select Options Schema Sync (Task 3)
    mappings.forEach(m => {
        if (m.targetType === 'single_select' || m.targetType === 'multiple_select') {
            const targetKey = m.targetFieldId === 'CREATE_NEW' ? newKeysMap[m.csvHeader] : m.targetFieldId;
            const uniqueVals = Array.from(new Set(newRecordsList.map(r => r.cells[targetKey]).flat().filter(Boolean)));
            const newOptions = uniqueVals.map((val, i) => ({
                id: \`opt_\${Date.now()}_\${i}\`,
                label: String(val),
                color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            }));
            
            const existingCol = db.columns.find(c => c.key === targetKey);
            const existingOptions = existingCol?.typeOptions?.options || [];
            // Merge options to avoid destroying existing ones
            const mergedOpts = [...existingOptions];
            newOptions.forEach(n => {
                if (!mergedOpts.find(e => e.label === n.label)) {
                    mergedOpts.push(n);
                }
            });

            // Direct store mutation required:
            updateColumn(targetKey, { typeOptions: { ...(existingCol?.typeOptions || {}), options: mergedOpts } });
        }
    });

    onOpenChange(false);`;

code = code.replace(regex, replacement);

fs.writeFileSync(file, code);
