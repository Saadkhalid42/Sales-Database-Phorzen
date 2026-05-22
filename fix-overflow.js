import fs from 'fs';
const file1 = 'src/components/Grid/Cells/CellText.tsx';
let code1 = fs.readFileSync(file1, 'utf8');

code1 = code1.replace(
  /className=\{\`w-full h-full flex items-center px-3 py-2 text-sm text-foreground overflow-hidden select-none outline-none/,
  "className={`w-full h-full flex items-center px-3 py-2 text-sm text-foreground ${(isEditing && isLongText) ? 'overflow-visible' : 'overflow-hidden'} select-none outline-none"
);

fs.writeFileSync(file1, code1);

const file2 = 'src/components/Grid/DataGrid.tsx';
let code2 = fs.readFileSync(file2, 'utf8');

code2 = code2.replace(
  /className=\{\`absolute top-0 h-full overflow-hidden shrink-0\`\}/,
  "className={`absolute top-0 h-full ${isActiveEditor ? 'overflow-visible' : 'overflow-hidden'} shrink-0`}"
);

fs.writeFileSync(file2, code2);
