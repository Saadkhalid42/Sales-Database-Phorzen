import fs from 'fs';
const file = 'src/store/useStore.ts';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const starts = [385, 452, 499, 508, 544, 651];

starts.forEach(startLine => {
  let openBraces = 0;
  let started = false;
  let endLine = -1;
  for (let i = startLine - 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('{')) {
      openBraces += (line.match(/\{/g) || []).length;
      started = true;
    }
    if (line.includes('}')) {
      openBraces -= (line.match(/\}/g) || []).length;
    }
    if (started && openBraces === 0) {
      endLine = i + 1;
      break;
    }
  }
  console.log(`Start: ${startLine}, End: ${endLine}`);
});
