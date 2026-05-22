import fs from 'fs';

let store = fs.readFileSync('src/store/useStore.ts', 'utf8');

// Add filterJoinOperator to View
store = store.replace(
  /export interface View \{/g,
  "export interface View {\n  filterJoinOperator?: 'and' | 'or';"
);

// Add updateRecord and updateColumn to AppState
store = store.replace(
  /export interface AppState \{/g,
  "export interface AppState {\n  updateRecord: (recordId: string, newValues: Record<string, any>) => void;\n  updateColumn: (databaseId: string, colKey: string, newProps: Partial<GridColumn>) => void;"
);

// Add implementations
const storeImplIndex = store.indexOf('export const useStore = create<AppState>()');
const implAdd = `
  updateRecord: (recordId, newValues) => set((state) => {
    // We already have updateRecordCell and updateRecordCells, but some components call updateRecord directly
    // This is a stub for now if it's missing, let's implement properly:
    const dbIndex = state.databases.findIndex(db => db.id === state.activeDatabaseId);
    if (dbIndex === -1) return state;
    
    const newDatabases = [...state.databases];
    const newDb = { ...newDatabases[dbIndex] };
    const newRecords = [...newDb.records];
    
    const recordIndex = newRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) return state;
    
    newRecords[recordIndex] = {
      ...newRecords[recordIndex],
      cells: { ...newRecords[recordIndex].cells, ...newValues }
    };
    
    newDb.records = newRecords;
    newDatabases[dbIndex] = newDb;
    
    // Manage undo/redo
    const past = [...state.past];
    if (past.length > 50) past.shift();
    past.push({
      records: JSON.parse(JSON.stringify(state.databases[dbIndex].records)),
      views: JSON.parse(JSON.stringify(state.databases[dbIndex].workspaces))
    });
    
    return { databases: newDatabases, past, future: [] };
  }),

  updateColumn: (databaseId, colKey, newProps) => set((state) => {
    const dbIndex = state.databases.findIndex(db => db.id === databaseId);
    if (dbIndex === -1) return state;
    const newDatabases = [...state.databases];
    const newDb = { ...newDatabases[dbIndex] };
    const newCols = [...newDb.columns];
    const colIndex = newCols.findIndex(c => c.key === colKey);
    if (colIndex === -1) return state;
    newCols[colIndex] = { ...newCols[colIndex], ...newProps };
    newDb.columns = newCols;
    newDatabases[dbIndex] = newDb;
    return { databases: newDatabases };
  }),
`;

if (!store.includes('updateRecord: (recordId, newValues)')) {
  store = store.replace(
    /addRecord: \(record\) => set\(\(state\) => \{/g,
    implAdd + '\n  addRecord: (record) => set((state) => {'
  );
}

fs.writeFileSync('src/store/useStore.ts', store);

