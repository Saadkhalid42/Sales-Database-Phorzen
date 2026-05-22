import fs from 'fs';
const file = 'src/store/useStore.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /  takeSnapshot: \(\) => set\(\(state\) => \{\n    const clone = JSON\.parse\(JSON\.stringify\(state\.databases\)\);\n    const newPast = \[\.\.\.state\.past, \{ databases: clone \}\];\n    if \(newPast\.length > 50\) newPast\.shift\(\);\n    return \{ past: newPast, future: \[\] \};\n  \}\),/;

const replacement = `  takeSnapshot: () => {
    const state = get();
    try {
      // Safe clone of the databases array (which holds all records and views)
      const snapshot = {
        databases: JSON.parse(JSON.stringify(state.databases))
      };
      set({ past: [...state.past.slice(-49), snapshot], future: [] });
    } catch (e) {
      console.error("Snapshot failed", e);
    }
  },`;

code = code.replace(regex, replacement);

fs.writeFileSync(file, code);
