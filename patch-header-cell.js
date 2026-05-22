import fs from 'fs';

let header = fs.readFileSync('src/components/Grid/ColumnHeader.tsx', 'utf8');
header = header.replace(/bg-\[rgb\(var\(--bg-color\)\)\]/g, 'bg-surface');
header = header.replace(/border-b border-primary\/10/g, 'border-b border-divider');
header = header.replace(/border-r border-primary\/10/g, 'border-r border-divider');
header = header.replace(/text-\[rgb\(var\(--text-color\)\)\]/g, 'text-text-secondary');
header = header.replace(/text-primary\/50/g, 'text-text-muted');
header = header.replace(/hover:bg-primary\/5/g, 'hover:bg-surface-sunken');
header = header.replace(/hover:text-primary/g, 'hover:text-text-primary');
header = header.replace(/font-medium/g, 'font-semibold uppercase tracking-wider text-[12px]');
fs.writeFileSync('src/components/Grid/ColumnHeader.tsx', header);

let cell = fs.readFileSync('src/components/Grid/GridCell.tsx', 'utf8');
cell = cell.replace(/border-\[rgba\(var\(--primary-color\),0\.3\)\]/g, 'border-accent');
cell = cell.replace(/border-transparent/g, 'border-transparent');
cell = cell.replace(/ring-1 ring-\[rgb\(var\(--primary-color\)\)\]/g, ''); // we use inset box-shadow now
fs.writeFileSync('src/components/Grid/GridCell.tsx', cell);

