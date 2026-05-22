import fs from 'fs';

let content = fs.readFileSync('src/components/Grid/DataGrid.tsx', 'utf8');

// Replace string literal '1px solid var(--divider)'
content = content.replace(
  /'1px solid var\(--divider\)'/g,
  "`1px solid color-mix(in srgb, var(--divider) var(--grid-line-opacity, 100%), transparent)`"
);

// Also replace the one inside the template literal for borderBottom if I missed anything, wait it's already fixed for cells.

fs.writeFileSync('src/components/Grid/DataGrid.tsx', content);

