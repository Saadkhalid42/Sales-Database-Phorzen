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
  'text-primary\\/50': 'text-text-muted',
  'text-primary\\/40': 'text-text-muted',
  'text-foreground\\/70': 'text-text-secondary',
  'text-foreground': 'text-text-primary',
  'hover:text-foreground': 'hover:text-text-primary',
  'text-\\[rgb\\(var\\(--primary-color\\)\\)\\]': 'text-accent',
  'bg-\\[rgba\\(var\\(--primary-color\\),0\\.15\\)\\]': 'bg-accent-subtle',
  'bg-\\[rgba\\(var\\(--primary-color\\),0\\.1\\)\\]': 'bg-accent-subtle',
  'border-\\[rgba\\(var\\(--primary-color\\),0\\.2\\)\\]': 'border-accent-subtle',
  'bg-\\[rgb\\(var\\(--bg-color\\)\\)\\]': 'bg-surface',
  'border-slate-200 dark:border-slate-800': 'border-divider',
  'bg-slate-200 dark:bg-slate-700': 'bg-divider',
  'bg-background\\/95': 'bg-surface/95',
  'bg-background\\/90': 'bg-surface/90',
  'bg-background': 'bg-surface',
  'bg-primary\\/5': 'bg-surface-sunken',
  'bg-primary\\/10': 'bg-surface-sunken',
  'bg-\\[#2135a6\\]': 'bg-accent',
  'text-\\[#2135a6\\]': 'text-accent',
  'border-\\[#2135a6\\]': 'border-accent',
  'ring-\\[#2135a6\\]': 'ring-accent',
  'bg-slate-50 dark:bg-slate-800\\/50': 'bg-surface-sunken',
  'border-slate-200': 'border-divider',
  'bg-white dark:bg-slate-900': 'bg-surface-raised',
  'shadow-sm': 'shadow-sm',
  'shadow-md': 'shadow-md',
  'shadow-lg': 'shadow-lg',
  'text-slate-500': 'text-text-muted',
  'text-slate-400': 'text-text-muted',
  'hover:bg-slate-100': 'hover:bg-surface-sunken',
  'dark:hover:bg-slate-800': '',
  'dark:border-slate-700': '',
  'dark:bg-slate-800': '',
  'dark:text-slate-400': '',
  'dark:bg-slate-900': '',
};

const processDir = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [pattern, replacement] of Object.entries(replaceMap)) {
        const regex = new RegExp(pattern, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      }
      
      // Fix style blocks injected into surface-raised elements
      if (changed) {
        content = content.replace(/<Dialog\.Content([^>]*)>/g, (match, p1) => {
          if (!p1.includes('bg-surface-raised')) {
             return `<Dialog.Content${p1.replace(/className="/, 'className="bg-surface-raised ')}>`;
          }
          return match;
        });
        fs.writeFileSync(fullPath, content);
      }
    }
  }
};

processDir('src/components');
processDir('src'); // App.tsx, etc.
