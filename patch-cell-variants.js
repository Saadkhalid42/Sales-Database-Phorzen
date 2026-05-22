import fs from 'fs';
import path from 'path';

const replaceMap = {
  'text-\\[rgb\\(var\\(--text-color\\)\\)\\]': 'text-text-primary',
  'text-sm': 'text-[13px]',
  'text-primary\\/50': 'text-text-muted',
  'text-primary\\/70': 'text-text-secondary',
  'bg-primary\\/10': 'bg-surface-sunken',
  'bg-\\[rgba\\(var\\(--primary-color\\),0\\.1\\)\\]': 'bg-accent-subtle',
  'text-\\[rgb\\(var\\(--primary-color\\)\\)\\]': 'text-accent',
  'ring-1 ring-primary\\/20': 'ring-1 ring-border',
};

const processDir = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [pattern, replacement] of Object.entries(replaceMap)) {
        const regex = new RegExp(pattern, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
};

processDir('src/components/Grid/Cells');
