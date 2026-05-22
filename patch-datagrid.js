import fs from 'fs';
import path from 'path';

let content = fs.readFileSync('src/components/Grid/DataGrid.tsx', 'utf8');

// Replace standard tailwind class patterns
const replacements = {
  'text-\\[rgb\\(var\\(--text-color\\)\\)\\]': 'text-text-primary',
  'data-\\[highlighted\\]:bg-\\[#2135a6\\]': 'data-[highlighted]:bg-accent-subtle',
  'data-\\[highlighted\\]:text-white': 'data-[highlighted]:text-accent',
  'bg-primary\\/10': 'bg-divider',
  'text-red-500': 'text-danger',
  'data-\\[highlighted\\]:bg-red-500': 'data-[highlighted]:bg-danger-subtle',
  'bg-\\[rgba\\(var\\(--text-color\\),0\\.02\\)\\]': 'bg-zebra',
  'bg-slate-900': 'bg-surface-raised',
  'text-white': 'text-text-primary',
  'dark:bg-slate-800': '',
  'border-white\\/10': 'border-border',
  'border-accent': 'border-accent',
  'bg-accent\\/10': 'bg-accent-subtle',
};

for (const [pattern, replacement] of Object.entries(replacements)) {
  content = content.replace(new RegExp(pattern, 'g'), replacement);
}

// Inline styles
content = content.replace(/backgroundColor: 'rgba\\(var\\(--primary-color\\), 0\\.08\\)'/g, "backgroundColor: 'var(--accent-subtle)'");
content = content.replace(/boxShadow: 'inset 0 0 0 1\\.5px rgb\\(var\\(--primary-color\\)\\)'/g, "boxShadow: 'inset 0 0 0 1.5px var(--accent)'");
content = content.replace(/backgroundColor: 'rgb\\(var\\(--bg-color\\)\\)'/g, "backgroundColor: 'var(--surface)'");
content = content.replace(/borderRight: '1px solid rgba\\(var\\(--border-color\\), 1\\)'/g, "borderRight: '1px solid var(--divider)'");
content = content.replace(/borderRight: '1px solid rgba\\(var\\(--border-color\\), var\\(--grid-border-opacity, 0\\.1\\)\\)'/g, "borderRight: '1px solid var(--divider)'");
content = content.replace(/borderBottom: '1px solid rgba\\(var\\(--border-color\\), var\\(--grid-border-opacity, 0\\.1\\)\\)'/g, "borderBottom: '1px solid var(--divider)'");
content = content.replace(/backgroundColor: isAlt \? 'rgba\\(var\\(--text-color\\), var\\(--zebra-bg-opacity, 0\\.02\\)\\)' : 'transparent'/g, "backgroundColor: isAlt ? 'var(--zebra)' : 'transparent'");

// Hover states inside row mapping
content = content.replace(/hover:bg-\[rgba\(var\(--text-color\),0\.02\)\]/g, 'hover:bg-accent-subtle/40');

fs.writeFileSync('src/components/Grid/DataGrid.tsx', content);
