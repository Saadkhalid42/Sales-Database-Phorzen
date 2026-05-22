import fs from 'fs';
const file = 'src/store/useStore.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Add to interface
if (!code.includes('takeSnapshot: () => void;')) {
  code = code.replace(/  toastMessage: string \| null;\n  setToastMessage: \(msg: string \| null\) => void;/, 
  `  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  
  past: Array<{ databases: Database[] }>;
  future: Array<{ databases: Database[] }>;
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;`);
}

// 2. Add to initial state
if (!code.includes('past: [],')) {
  code = code.replace(/  databases: \[\],\n  activeDatabaseId: null,/,
  `  past: [],
  future: [],
  takeSnapshot: () => set((state) => {
    const clone = JSON.parse(JSON.stringify(state.databases));
    const newPast = [...state.past, { databases: clone }];
    if (newPast.length > 50) newPast.shift();
    return { past: newPast, future: [] };
  }),
  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const lastPast = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);
    const clone = JSON.parse(JSON.stringify(state.databases));
    const newFuture = [...state.future, { databases: clone }];
    return { past: newPast, future: newFuture, databases: lastPast.databases };
  }),
  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const lastFuture = state.future[state.future.length - 1];
    const newFuture = state.future.slice(0, state.future.length - 1);
    const clone = JSON.parse(JSON.stringify(state.databases));
    const newPast = [...state.past, { databases: clone }];
    return { past: newPast, future: newFuture, databases: lastFuture.databases };
  }),
  databases: [],
  activeDatabaseId: null,`);
}

fs.writeFileSync(file, code);
