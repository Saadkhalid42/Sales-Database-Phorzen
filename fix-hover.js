import fs from 'fs';

let content = fs.readFileSync('src/components/Grid/DataGrid.tsx', 'utf8');

// 1. Fix Selection Mode Checkboxes
content = content.replace(
  /className=\{\`absolute inset-0 flex items-center justify-center transition-opacity \\\$\{selectedRowIds\?\.includes\\(record\.id\\) \? 'opacity-100' : 'opacity-0 group-hover\/checkbox:opacity-100'\}\`\}/g,
  `className={\`absolute inset-0 flex items-center justify-center transition-opacity \${(selectedRowIds && selectedRowIds.length > 0) || selectedRowIds?.includes(record.id) ? 'opacity-100' : 'opacity-0 group-hover/checkbox:opacity-100'}\`}`
);

content = content.replace(
  /className=\{\`flex flex-col items-center justify-center \\\$\{selectedRowIds\?\.includes\\(record\.id\\) \? 'opacity-0' : 'group-hover\/checkbox:opacity-0'\} transition-opacity\`\}/g,
  `className={\`flex flex-col items-center justify-center \${(selectedRowIds && selectedRowIds.length > 0) || selectedRowIds?.includes(record.id) ? 'opacity-0' : 'group-hover/checkbox:opacity-0'} transition-opacity\`}`
);

// 2. Fix Expand Icon Hover
content = content.replace(
  /className="absolute right-1 top-1\/2 -translate-y-1\/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"/g,
  `className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/first-cell:opacity-100 transition-opacity z-10"`
);

content = content.replace(
  /className=\{\`absolute top-0 h-full \\\$\{isActiveEditor \? 'overflow-visible' : 'overflow-hidden'\} shrink-0\`\}/g,
  `className={\`absolute top-0 h-full \${virtualCol.index === 0 ? 'group/first-cell' : ''} \${isActiveEditor ? 'overflow-visible' : 'overflow-hidden'} shrink-0\`}`
);

fs.writeFileSync('src/components/Grid/DataGrid.tsx', content);

