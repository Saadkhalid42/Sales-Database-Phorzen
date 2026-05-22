import fs from 'fs';

let content = fs.readFileSync('src/components/Grid/DataGrid.tsx', 'utf8');

// 1. Bulk Action Bar Solid Background
content = content.replace(
  /className="fixed bottom-6 left-6 z-50 bg-surface-raised text-text-primary rounded-xl shadow-2xl flex items-center gap-4 p-2 border border-border animate-in slide-in-from-bottom-5" style=\{\{ zIndex: 9999 \}\}/,
  'className="fixed bottom-6 left-6 z-50 text-text-primary rounded-xl shadow-2xl flex items-center gap-4 p-2 border border-border animate-in slide-in-from-bottom-5" style={{ zIndex: 9999, backgroundColor: "var(--surface-raised)" }}'
);

// 2. Checkbox Hitmarker
const oldCheckbox = `<div className={\`absolute inset-0 flex items-center justify-center transition-opacity \${(selectedRowIds && selectedRowIds.length > 0) || selectedRowIds?.includes(record.id) ? 'opacity-100' : 'opacity-0 group-hover/checkbox:opacity-100'}\`}>
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds?.includes(record.id) || false}
                          onChange={() => toggleRowSelection && toggleRowSelection(record.id)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                        />
                      </div>`;

const newCheckbox = `<div 
                        className={\`absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer \${(selectedRowIds && selectedRowIds.length > 0) || selectedRowIds?.includes(record.id) ? 'opacity-100' : 'opacity-0 group-hover/checkbox:opacity-100'}\`}
                        onClick={() => toggleRowSelection && toggleRowSelection(record.id)}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds?.includes(record.id) || false}
                          onChange={() => {}} 
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer pointer-events-none"
                        />
                      </div>`;
content = content.replace(oldCheckbox, newCheckbox);

// 3. Row Highlight for Checkbox Selection
content = content.replace(
  /const isRowActive = selectionRange\?\.startRowId === record\.id;/g,
  `const isRowActive = selectionRange?.startRowId === record.id;\n              const isCheckboxSelected = selectedRowIds?.includes(record.id);`
);

content = content.replace(
  /backgroundColor: 'var\\(--surface-raised\\)',/g,
  `backgroundColor: isCheckboxSelected ? \`color-mix(in srgb, var(--surface-raised) 90%, var(--accent))\` : 'var(--surface-raised)',`
);

content = content.replace(
  /backgroundColor: isAlt \? \`color-mix\\(in srgb, var\\(--surface-raised\\) \\\$\{100 - \\(zebraOpacity \* 100\\)\\}%, var\\(--accent\\)\\)\` : 'var\\(--surface-raised\\)'/g,
  `backgroundColor: isCheckboxSelected ? \`color-mix(in srgb, var(--surface-raised) 90%, var(--accent))\` : (isAlt ? \`color-mix(in srgb, var(--surface-raised) \${100 - (zebraOpacity * 100)}%, var(--accent))\` : 'var(--surface-raised)')`
);

content = content.replace(
  /backgroundColor: isAlt \? \`color-mix\\(in srgb, var\\(--accent\\) \\\$\{zebraOpacity \* 100\\}%, transparent\\)\` : 'transparent'/g,
  `backgroundColor: isCheckboxSelected ? \`color-mix(in srgb, var(--accent) 10%, transparent)\` : (isAlt ? \`color-mix(in srgb, var(--accent) \${zebraOpacity * 100}%, transparent)\` : 'transparent')`
);

fs.writeFileSync('src/components/Grid/DataGrid.tsx', content);

