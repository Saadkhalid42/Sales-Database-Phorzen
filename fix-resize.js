import fs from 'fs';
const file = 'src/components/Grid/DataGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

// Update column wrapper
const regex = /<div\s*key=\{virtualCol\.key\}\s*className=\{\`absolute top-0 h-full \$\{isActiveEditor \? 'overflow-visible' : 'overflow-hidden'\} shrink-0\`\}\s*style=\{\{\s*left: 0,\s*top: 0,\s*width: \`\$\{virtualCol\.size\}px\`,/;

const replacement = `<div
                        key={virtualCol.key}
                        ref={columnVirtualizer.measureElement}
                        data-index={virtualCol.index}
                        className={\`absolute top-0 h-full \${isActiveEditor ? 'overflow-visible' : 'overflow-hidden'} shrink-0\`}
                        style={{
                          left: 0,
                          top: 0,
                          width: \`\${col.width || 150}px\`,`;

code = code.replace(regex, replacement);

// And the header sticky column wrapper
const regexHeader = /<div\s*key=\{virtualCol\.key\}\s*className=\{\`absolute top-0 h-full shrink-0\`\}\s*style=\{\{\s*left: 0,\s*top: 0,\s*width: \`\$\{virtualCol\.size\}px\`,/;

const replacementHeader = `<div
                    key={virtualCol.key}
                    ref={columnVirtualizer.measureElement}
                    data-index={virtualCol.index}
                    className={\`absolute top-0 h-full shrink-0\`}
                    style={{
                      left: 0,
                      top: 0,
                      width: \`\${col.width || 150}px\`,`;

code = code.replace(regexHeader, replacementHeader);

fs.writeFileSync(file, code);
