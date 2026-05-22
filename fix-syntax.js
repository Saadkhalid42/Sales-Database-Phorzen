import fs from 'fs';
const file = 'src/store/useStore.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Extract the rogue block
const rogueRegex = /\s*changeColumnType: \(colKey, newType, newTypeOptions\) => set\(\(state\) => \{[\s\S]*?return \{ \.\.\.db, columns: newCols, records: newRecords \};\n          \}\)\n        \};\n      \}\),/;
const match = code.match(rogueRegex);
let rogueBlock = match ? match[0] : null;

if (rogueBlock) {
  // 2. Remove the rogue block from the interface
  code = code.replace(rogueBlock, '');
  
  // 3. Insert it into the actual implementation block right before updateColumn
  code = code.replace(
    /updateColumn: \(key, updates\) => set/,
    rogueBlock + '\n      updateColumn: (key, updates) => set'
  );
  
  fs.writeFileSync(file, code);
  console.log("Syntax fixed!");
} else {
  console.log("Could not find the rogue block with regex 1, trying regex 2");
  const fallbackRegex = /      changeColumnType: \(colKey, newType, newTypeOptions\) => set\(\(state\) => \{[\s\S]*?\}\),\n      updateColumn: \(key: string, updates: Partial<GridColumn>\) => void;/;
  const match2 = code.match(fallbackRegex);
  if (match2) {
    const block = match2[0].replace('      updateColumn: (key: string, updates: Partial<GridColumn>) => void;', '');
    code = code.replace(block, ''); // remove from interface
    
    // add interface correctly
    code = code.replace('updateColumn: (key: string, updates: Partial<GridColumn>) => void;', 'updateColumn: (key: string, updates: Partial<GridColumn>) => void;');
    
    // insert to implementation
    code = code.replace(/      updateColumn: \(key, updates\) => set/, block + '      updateColumn: (key, updates) => set');
    fs.writeFileSync(file, code);
    console.log("Syntax fixed with fallback regex!");
  } else {
      console.log("Could not find rogue block at all!");
  }
}
