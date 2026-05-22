import fs from 'fs';

let content = fs.readFileSync('src/components/Grid/Cells/CellText.tsx', 'utf8');

content = content.replace(
  /backgroundColor: 'rgb\\(var\\(--bg-color\\)\\)',/g,
  `backgroundColor: 'var(--surface-raised)',
              color: 'var(--text-color)',`
);

content = content.replace(
  /border: '2px solid #2135a6'/g,
  `border: '2px solid var(--accent)'`
);

fs.writeFileSync('src/components/Grid/Cells/CellText.tsx', content);

