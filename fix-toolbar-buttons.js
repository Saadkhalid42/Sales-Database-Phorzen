import fs from 'fs';

// 1. ViewDropdown.tsx
let viewDropdown = fs.readFileSync('src/components/Toolbar/ViewDropdown.tsx', 'utf8');
viewDropdown = viewDropdown.replace(/<span className="truncate font-semibold">\{activeView\?\.name \|\| 'Select View'\}<\/span>/, '');
viewDropdown = viewDropdown.replace(/<ChevronDown size=\{16\} className="flex-shrink-0" \/>/, '');
viewDropdown = viewDropdown.replace(/className="flex items-center justify-center p-2 rounded-lg text-text-primary hover:text-accent hover:bg-accent-subtle data-\[state=open\]:text-accent data-\[state=open\]:bg-accent-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring"/, 'className="flex items-center justify-center p-2.5 rounded-[16px] text-text-primary bg-surface-raised border border-divider shadow-sm hover:shadow-md hover:text-accent transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring"');
fs.writeFileSync('src/components/Toolbar/ViewDropdown.tsx', viewDropdown);

// 2. WorkspaceDropdown.tsx
let workspaceDropdown = fs.readFileSync('src/components/Toolbar/WorkspaceDropdown.tsx', 'utf8');
workspaceDropdown = workspaceDropdown.replace(/className="flex items-center justify-center p-2 rounded-lg text-text-primary hover:text-accent hover:bg-accent-subtle data-\[state=open\]:text-accent data-\[state=open\]:bg-accent-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring"/, 'className="flex items-center justify-center p-2.5 rounded-[16px] text-text-primary bg-surface-raised border border-divider shadow-sm hover:shadow-md hover:text-accent transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring"');
fs.writeFileSync('src/components/Toolbar/WorkspaceDropdown.tsx', workspaceDropdown);

// 3. Toolbar.tsx
let toolbar = fs.readFileSync('src/components/Toolbar/Toolbar.tsx', 'utf8');

// Filter button
toolbar = toolbar.replace(/className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-text-primary hover:text-accent hover:bg-accent-subtle data-\[state=open\]:text-accent data-\[state=open\]:bg-accent-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring text-\[13px\]"/g, 'className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[16px] text-text-primary bg-surface-raised border border-divider shadow-sm hover:shadow-md hover:text-accent transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring text-[13px]"');

// Sort button
toolbar = toolbar.replace(/className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-text-primary hover:text-accent hover:bg-accent-subtle data-\[state=open\]:text-accent data-\[state=open\]:bg-accent-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring text-\[13px\]"/g, 'className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[16px] text-text-primary bg-surface-raised border border-divider shadow-sm hover:shadow-md hover:text-accent transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring text-[13px]"');

// Search box
toolbar = toolbar.replace(/placeholder="Search \(Cmd\+F\)"/g, 'placeholder="Search"');

// Settings button (might just be a p-2 rounded-full)
toolbar = toolbar.replace(/className="flex items-center justify-center p-2 rounded-full text-text-primary hover:text-accent hover:bg-accent-subtle data-\[state=open\]:text-accent data-\[state=open\]:bg-accent-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring text-\[13px\]"/g, 'className="flex items-center justify-center p-2.5 rounded-[16px] text-text-primary bg-surface-raised border border-divider shadow-sm hover:shadow-md hover:text-accent transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring text-[13px]"');

fs.writeFileSync('src/components/Toolbar/Toolbar.tsx', toolbar);

