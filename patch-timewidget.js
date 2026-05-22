import fs from 'fs';
const file = 'src/store/useStore.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('timeWidgetEnabled?: boolean;')) {
  code = code.replace(/  altColoringEnabled: boolean;\n  setAltColoringEnabled: \(enabled: boolean\) => void;/, 
  `  altColoringEnabled: boolean;
  setAltColoringEnabled: (enabled: boolean) => void;
  timeWidgetEnabled?: boolean;
  setTimeWidgetEnabled?: (enabled: boolean) => void;`);
}

if (!code.includes('timeWidgetEnabled: true,')) {
  code = code.replace(/      altColoringEnabled: false,\n      setAltColoringEnabled: \(enabled\) => set\(\{ altColoringEnabled: enabled \}\),/,
  `      altColoringEnabled: false,
      setAltColoringEnabled: (enabled) => set({ altColoringEnabled: enabled }),
      timeWidgetEnabled: true,
      setTimeWidgetEnabled: (enabled) => set({ timeWidgetEnabled: enabled }),`);
}

fs.writeFileSync(file, code);
