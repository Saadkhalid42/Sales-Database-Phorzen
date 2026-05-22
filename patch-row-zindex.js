import fs from 'fs';
const file = 'src/components/Grid/DataGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

const replacement = `              const isAlt = altColoringEnabled && virtualRow.index % 2 !== 0;
              const isRowActive = selectionRange?.startRowId === record.id;
            
              return (
                <div
                  key={virtualRow.key}
                  className="absolute top-0 left-0 w-full group transition-colors flex flex-nowrap"
                  style={{
                    height: \`\${virtualRow.size}px\`,
                    transform: \`translateY(\${virtualRow.start}px)\`,
                    borderBottom: '1px solid rgba(var(--border-color), var(--grid-border-opacity, 0.1))',
                    backgroundColor: isAlt ? 'rgba(var(--primary-color), var(--zebra-bg-opacity, 0.02))' : 'transparent',
                    zIndex: isRowActive ? 50 : 1
                  }}
                >`;

code = code.replace(/              const isAlt = altColoringEnabled && virtualRow\.index % 2 !== 0;\n\s*return \(\n\s*<div\n\s*key=\{virtualRow\.key\}\n\s*className="absolute top-0 left-0 w-full group transition-colors flex flex-nowrap"\n\s*style=\{\{\n\s*height: `\$\{virtualRow\.size\}px`,\n\s*transform: `translateY\(\$\{virtualRow\.start\}px\)`,\n\s*borderBottom: '1px solid rgba\(var\(--border-color\), var\(--grid-border-opacity, 0\.1\)\)',\n\s*backgroundColor: isAlt \? 'rgba\(var\(--primary-color\), var\(--zebra-bg-opacity, 0\.02\)\)' : 'transparent'\n\s*\}\}\n\s*>/, replacement);

fs.writeFileSync(file, code);
