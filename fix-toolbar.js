import fs from 'fs';

// 1. Toolbar.tsx
let toolbar = fs.readFileSync('src/components/Toolbar/Toolbar.tsx', 'utf8');

// Remove Deep Dark and Soft Light
toolbar = toolbar.replace(
  /export const THEMES = \[\n.*\n.*\n.*\n.*\n.*\n.*\n\];/,
  `export const THEMES = [
  { id: 'clinical-light', name: 'Clinical Light' },
  { id: 'warm-light', name: 'Warm Light' },
  { id: 'midnight-blue', name: 'Midnight Blue' },
  { id: 'oled-black', name: 'OLED Black' }
];`
);

// Remove Search Icon
toolbar = toolbar.replace(
  /<Search size=\{14\} className="absolute left-2 top-1\/2 -translate-y-1\/2 text-text-muted opacity-70 group-focus-within:text-accent transition-colors" \/>/,
  ''
);
toolbar = toolbar.replace(
  /className="w-full bg-transparent text-text-primary text-\[13px\] placeholder:text-text-muted focus:outline-none pl-7 pr-2 py-0\.5"/,
  'className="w-full bg-transparent text-text-primary text-[13px] placeholder:text-text-muted focus:outline-none pl-3 pr-2 py-0.5"'
);

fs.writeFileSync('src/components/Toolbar/Toolbar.tsx', toolbar);

// 2. FilterPopover.tsx
let filterPopover = fs.readFileSync('src/components/Toolbar/FilterPopover.tsx', 'utf8');
filterPopover = filterPopover.replace(/w-\[450px\]/g, 'w-[600px]');
fs.writeFileSync('src/components/Toolbar/FilterPopover.tsx', filterPopover);

// 3. theme-fix.css
let themeFix = fs.readFileSync('src/theme-fix.css', 'utf8');
themeFix = themeFix.replace(/--surface: #FFFFFF;\n\s*--surface-raised: #FFFFFF;/g, '');
fs.writeFileSync('src/theme-fix.css', themeFix);

