import fs from 'fs';
import path from 'path';

const replaceMap = {
  'text-\\[rgb\\(var\\(--text-color\\)\\)\\]': 'text-text-primary',
  'hover:text-\\[rgb\\(var\\(--primary-color\\)\\)\\]': 'hover:text-accent',
  'hover:bg-\\[rgba\\(var\\(--primary-color\\),0\\.05\\)\\]': 'hover:bg-accent-subtle',
  'data-\\[state=open\\]:text-\\[rgb\\(var\\(--primary-color\\)\\)\\]': 'data-[state=open]:text-accent',
  'data-\\[state=open\\]:bg-\\[rgba\\(var\\(--primary-color\\),0\\.05\\)\\]': 'data-[state=open]:bg-accent-subtle',
  'focus:ring-\\[rgb\\(var\\(--primary-color\\)\\)\\]': 'focus:ring-focus-ring',
  'style=\\{\\{ backgroundColor: \'rgb\\(var\\(--bg-color\\)\\)\' \\}\\}': '',
  'data-\\[highlighted\\]:bg-\\[#2135a6\\]': 'data-[highlighted]:bg-accent-subtle',
  'data-\\[highlighted\\]:text-white': 'data-[highlighted]:text-accent',
  'border-primary\\/20': 'border-border',
  'bg-primary\\/20': 'bg-divider',
  'text-primary\\/70': 'text-text-secondary',
  'text-foreground\\/70': 'text-text-secondary',
  'text-foreground': 'text-text-primary',
  'hover:text-foreground': 'hover:text-text-primary',
  'text-\\[rgb\\(var\\(--primary-color\\)\\)\\]': 'text-accent',
  'bg-\\[rgba\\(var\\(--primary-color\\),0\\.15\\)\\]': 'bg-accent-subtle',
  'border-\\[rgba\\(var\\(--primary-color\\),0\\.2\\)\\]': 'border-accent-subtle'
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
      // specifically add bg-surface-raised where style backgroundColor was removed
      if (changed) {
        content = content.replace(/<DropdownMenu\.Content([^>]*)>/g, (match, p1) => {
          if (!p1.includes('bg-surface-raised')) {
             return `<DropdownMenu.Content${p1.replace(/className="/, 'className="bg-surface-raised ')}>`;
          }
          return match;
        });
        fs.writeFileSync(fullPath, content);
      }
    }
  }
};

processDir('src/components/Toolbar');
