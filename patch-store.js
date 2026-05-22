import fs from 'fs';

let store = fs.readFileSync('src/store/useStore.ts', 'utf8');

// 1. Add state to AppState
if (!store.includes('selectedRowIds: string[]')) {
  store = store.replace(
    /export interface AppState \{/,
    `export interface AppState {
  selectedRowIds: string[];
  toggleRowSelection: (recordId: string) => void;
  selectAllRows: (recordIds: string[]) => void;
  clearRowSelection: () => void;
  deleteRecords: (recordIds: string[]) => void;`
  );
}

// 2. Add implementation
const implAdd = `
  selectedRowIds: [],
  toggleRowSelection: (recordId) => set((state) => {
    const isSelected = state.selectedRowIds.includes(recordId);
    return {
      selectedRowIds: isSelected 
        ? state.selectedRowIds.filter(id => id !== recordId)
        : [...state.selectedRowIds, recordId]
    };
  }),
  selectAllRows: (recordIds) => set({ selectedRowIds: recordIds }),
  clearRowSelection: () => set({ selectedRowIds: [] }),
  deleteRecords: (recordIds) => set((state) => {
    const dbIndex = state.databases.findIndex(db => db.id === state.activeDatabaseId);
    if (dbIndex === -1) return state;
    
    const newDatabases = [...state.databases];
    const newDb = { ...newDatabases[dbIndex] };
    
    newDb.records = newDb.records.filter(r => !recordIds.includes(r.id));
    newDatabases[dbIndex] = newDb;
    
    const past = [...state.past];
    if (past.length > 50) past.shift();
    past.push({
      records: JSON.parse(JSON.stringify(state.databases[dbIndex].records)),
      views: JSON.parse(JSON.stringify(state.databases[dbIndex].workspaces))
    });
    
    return { databases: newDatabases, past, future: [], selectedRowIds: [] };
  }),
`;

if (!store.includes('selectedRowIds: [],')) {
  store = store.replace(
    /export const useStore = create<AppState>\(\)\(\(set, get\) => \(\{/,
    `export const useStore = create<AppState>()((set, get) => ({\n${implAdd}`
  );
}

fs.writeFileSync('src/store/useStore.ts', store);
