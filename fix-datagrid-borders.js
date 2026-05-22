import fs from 'fs';

let content = fs.readFileSync('src/components/Grid/DataGrid.tsx', 'utf8');

// Remove borderBottom and backgroundColor from row wrapper
content = content.replace(
  /borderBottom: \`1px solid color-mix\\(in srgb, var\\(--divider\\) \$\{borderOpacity \* 100\}%, transparent\\)\`,\\s*backgroundColor: isAlt \? \`color-mix\\(in srgb, var\\(--accent\\) \$\{zebraOpacity \* 100\}%, transparent\\)\` : 'transparent',/,
  ''
);

// Add borderBottom and backgroundColor to frozen cells and normal cells
content = content.replace(
  /backgroundColor: 'var\\(--surface-raised\\)'/g,
  `backgroundColor: isAlt ? \`color-mix(in srgb, var(--surface-raised) \${100 - (zebraOpacity * 100)}%, var(--accent))\` : 'var(--surface-raised)'`
);

content = content.replace(
  /borderRight: \`1px solid color-mix\\(in srgb, var\\(--divider\\) \$\{borderOpacity \* 100\}%, transparent\\)\` \}\),/g,
  `borderRight: \`1px solid color-mix(in srgb, var(--divider) \${borderOpacity * 100}%, transparent)\`, borderBottom: \`1px solid color-mix(in srgb, var(--divider) \${borderOpacity * 100}%, transparent)\`, backgroundColor: isAlt ? \`color-mix(in srgb, var(--accent) \${zebraOpacity * 100}%, transparent)\` : 'transparent' }),`
);

// For frozen cells, the borderRight is a hardcoded '1px solid var(--divider)', we should add borderBottom
content = content.replace(
  /borderRight: '1px solid var\\(--divider\\)' \}/g,
  `borderRight: '1px solid var(--divider)', borderBottom: \`1px solid color-mix(in srgb, var(--divider) \${borderOpacity * 100}%, transparent)\` }`
);

fs.writeFileSync('src/components/Grid/DataGrid.tsx', content);

