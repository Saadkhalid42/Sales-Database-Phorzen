import fs from 'fs';
let wsCode = fs.readFileSync('src/components/Toolbar/WorkspaceDropdown.tsx', 'utf8');
wsCode = wsCode.replace(
  /<button className="flex items-center gap-2 px-3 py-1\.5 rounded-lg text-\[rgb\(var\(--text-color\)\)\] hover:text-\[rgb\(var\(--primary-color\)\)\] hover:bg-\[rgba\(var\(--primary-color\),0\.05\)\] data-\[state=open\]:text-\[rgb\(var\(--primary-color\)\)\] data-\[state=open\]:bg-\[rgba\(var\(--primary-color\),0\.05\)\] transition-colors focus:outline-none focus:ring-2 focus:ring-\[rgb\(var\(--primary-color\)\)\] max-w-\[200px\]">/,
  '<button className="flex items-center justify-center p-2 rounded-lg text-[rgb(var(--text-color))] hover:text-[rgb(var(--primary-color))] hover:bg-[rgba(var(--primary-color),0.05)] data-[state=open]:text-[rgb(var(--primary-color))] data-[state=open]:bg-[rgba(var(--primary-color),0.05)] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-color))]">'
).replace(
  /<span className="truncate font-semibold">\{activeWs\?\.name \|\| 'Select Workspace'\}<\/span>\n\s*<ChevronDown size=\{16\} className="flex-shrink-0" \/>/,
  ''
);
fs.writeFileSync('src/components/Toolbar/WorkspaceDropdown.tsx', wsCode);

let viewCode = fs.readFileSync('src/components/Toolbar/ViewDropdown.tsx', 'utf8');
viewCode = viewCode.replace(
  /<button className="flex items-center gap-2 px-3 py-1\.5 rounded-lg text-\[rgb\(var\(--text-color\)\)\] hover:text-\[rgb\(var\(--primary-color\)\)\] hover:bg-\[rgba\(var\(--primary-color\),0\.05\)\] data-\[state=open\]:text-\[rgb\(var\(--primary-color\)\)\] data-\[state=open\]:bg-\[rgba\(var\(--primary-color\),0\.05\)\] transition-colors focus:outline-none focus:ring-2 focus:ring-\[rgb\(var\(--primary-color\)\)\] max-w-\[200px\]">/,
  '<button className="flex items-center justify-center p-2 rounded-lg text-[rgb(var(--text-color))] hover:text-[rgb(var(--primary-color))] hover:bg-[rgba(var(--primary-color),0.05)] data-[state=open]:text-[rgb(var(--primary-color))] data-[state=open]:bg-[rgba(var(--primary-color),0.05)] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-color))]">'
).replace(
  /<span className="truncate font-semibold">\{currentView\?\.name \|\| 'Select View'\}<\/span>\n\s*<ChevronDown size=\{16\} className="flex-shrink-0" \/>/,
  ''
);
fs.writeFileSync('src/components/Toolbar/ViewDropdown.tsx', viewCode);
