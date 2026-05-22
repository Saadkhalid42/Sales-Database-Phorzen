import fs from 'fs';

let header = fs.readFileSync('src/components/Grid/ColumnHeader.tsx', 'utf8');
header = header.replace(/text-\[rgba\(var\(--text-color\),0\.6\)\]/g, 'text-text-secondary');
header = header.replace(/hover:bg-\[rgba\(var\(--text-color\),0\.05\)\]/g, 'hover:bg-surface-sunken');
header = header.replace(/bg-\[rgba\(var\(--text-color\),0\.02\)\]/g, 'bg-surface');
header = header.replace(/rounded-md/g, 'rounded-xl'); // soften dropdown items
fs.writeFileSync('src/components/Grid/ColumnHeader.tsx', header);

const popovers = [
  'src/components/Toolbar/FilterPopover.tsx',
  'src/components/Toolbar/SortPopover.tsx',
  'src/components/Toolbar/HideFieldsPopover.tsx',
];

for (const popover of popovers) {
  if (fs.existsSync(popover)) {
    let content = fs.readFileSync(popover, 'utf8');
    content = content.replace(/p-4/g, 'p-6'); // more generous padding
    content = content.replace(/rounded-xl/g, 'rounded-[24px]'); // larger border radius
    content = content.replace(/rounded-md/g, 'rounded-xl'); // inner elements
    content = content.replace(/rounded-sm/g, 'rounded-full'); // buttons
    content = content.replace(/shadow-md/g, 'shadow-lg');
    fs.writeFileSync(popover, content);
  }
}

