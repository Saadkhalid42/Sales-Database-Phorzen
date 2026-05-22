import fs from 'fs';
const file = 'src/components/Toolbar/CSVImportWizard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Ensure updateColumn and extractSelectOptions are imported
if (!code.includes('updateColumn')) {
  code = code.replace(/const changeColumnType = useStore\\(state => state.changeColumnType\\);/, 
  `const changeColumnType = useStore(state => state.changeColumnType);\n  const updateColumn = useStore(state => state.updateColumn);`);
}
if (!code.includes('extractSelectOptions')) {
  code = code.replace(/import \{ convertValue, analyzeDateColumn \} from '\.\.\/\.\.\/utils\/DataEngine';/, 
  `import { convertValue, analyzeDateColumn, extractSelectOptions } from '../../utils/DataEngine';`);
}

const replacement = `  const handleCommit = () => {
    const newKeysMap: Record<string, string> = {};
    const dateContexts: Record<string, any> = {};
    const selectOptionsMap: Record<string, any[]> = {};
    
    // Determine date contexts and select options BEFORE creating
    mappings.forEach(m => {
        const targetKey = m.targetFieldId === 'CREATE_NEW' ? \`col_\${Date.now()}_\${Math.random().toString(36).substr(2,9)}\` : m.targetFieldId;
        if (m.targetFieldId === 'CREATE_NEW') newKeysMap[m.csvHeader] = targetKey;
        
        if (m.targetType === 'date') {
            dateContexts[targetKey] = analyzeDateColumn(csvData.map(r => r[m.csvHeader]));
        }
        
        if (m.targetType === 'single_select' || m.targetType === 'multiple_select') {
            const allValues = csvData.map(r => r[m.csvHeader]);
            const generatedOptions = extractSelectOptions(allValues);
            selectOptionsMap[targetKey] = generatedOptions;
            
            // If mapping to an existing select column, we need to update its schema explicitly
            if (m.targetFieldId !== 'CREATE_NEW') {
                const existingCol = db.columns.find(c => c.key === m.targetFieldId);
                const existingOptions = existingCol?.typeOptions?.options || [];
                // Merge options, skipping duplicates
                const newOpts = generatedOptions.filter(go => !existingOptions.find((eo: any) => eo.label === go.label));
                updateColumn(m.targetFieldId, {
                    typeOptions: { ...(existingCol?.typeOptions || {}), options: [...existingOptions, ...newOpts] }
                });
            }
        }
    });

    // 1. Create new columns perfectly formatted
    mappings.forEach((m) => {
        if (m.targetFieldId === 'CREATE_NEW') {
            const newKey = newKeysMap[m.csvHeader];
            const typeOpts: any = {};
            if (m.targetType === 'single_select' || m.targetType === 'multiple_select') {
                typeOpts.options = selectOptionsMap[newKey];
            }
            addColumn({
                key: newKey,
                label: m.csvHeader,
                type: m.targetType,
                width: 150,
                typeOptions: typeOpts
            });
        }
    });

    // 2. Insert records pre-parsed to fix the React batching / empty date bug
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

        addRecord({
            id: \`rec_import_\${Date.now()}_\${idx}\`,
            cells,
            _flagged: Object.keys(flagged).length > 0 ? flagged : undefined
        });
    });

    onOpenChange(false);
    setStep(1);
    setCsvData([]);
  };`;

code = code.replace(/  const handleCommit = \(\) => \{[\s\S]*?setCsvData\(\[\]\);\n  \};/, replacement);

fs.writeFileSync(file, code);
