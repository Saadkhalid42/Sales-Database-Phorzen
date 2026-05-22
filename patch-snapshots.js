import fs from 'fs';
const file = 'src/store/useStore.ts';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const starts = [385, 452, 499, 508, 544, 651];

starts.sort((a, b) => b - a).forEach(startLine => {
  let openBraces = 0;
  let started = false;
  let endLine = -1;
  let startIdx = startLine - 1;
  
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('{')) {
      openBraces += (line.match(/\{/g) || []).length;
      started = true;
    }
    if (line.includes('}')) {
      openBraces -= (line.match(/\}/g) || []).length;
    }
    if (started && openBraces === 0) {
      endLine = i;
      break;
    }
  }

  if (endLine !== -1) {
    // Modify end first
    lines[endLine] = lines[endLine].replace('}),', '}); },').replace('})', '}); },');
    
    // Modify start
    lines[startIdx] = lines[startIdx].replace('=> set((state) => {', '=> {\n        get().takeSnapshot();\n        set((state) => {');
  }
});

fs.writeFileSync(file, lines.join('\n'));
