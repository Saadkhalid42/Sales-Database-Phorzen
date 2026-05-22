import fs from 'fs';

// 1. Fix Toolbar.tsx Theme IDs
let toolbar = fs.readFileSync('src/components/Toolbar/Toolbar.tsx', 'utf8');
toolbar = toolbar.replace(/'theme-default-light'/g, "'clinical-light'");
toolbar = toolbar.replace(/'theme-soft-light'/g, "'soft-light'");
toolbar = toolbar.replace(/'theme-warm-light'/g, "'warm-light'");
toolbar = toolbar.replace(/'theme-default-dark'/g, "'deep-dark'");
toolbar = toolbar.replace(/'theme-midnight-blue'/g, "'midnight-blue'");
toolbar = toolbar.replace(/'theme-oled-black'/g, "'oled-black'");
fs.writeFileSync('src/components/Toolbar/Toolbar.tsx', toolbar);

// 2. Fix theme-fix.css to have pure white for Clinical Light and Soft Light
let themeFix = fs.readFileSync('src/theme-fix.css', 'utf8');

// Soft Light: make surface pure white, canvas very light gray
themeFix = themeFix.replace(/--canvas:#ECEAF6; --surface:#FBFBFE; --surface-raised:#FFFFFF; --surface-sunken:#F1EFFA;/g, '--canvas:#F3F4F6; --surface:#FFFFFF; --surface-raised:#FFFFFF; --surface-sunken:#F9FAFB;');
// Clinical Light: already has --surface:#FFFFFF
themeFix = themeFix.replace(/--canvas:#F4F5FA; --surface:#FFFFFF; --surface-raised:#FFFFFF; --surface-sunken:#EEF0F7;/g, '--canvas:#F3F4F6; --surface:#FFFFFF; --surface-raised:#FFFFFF; --surface-sunken:#F9FAFB;');

// Warm Light: make surface pure white
themeFix = themeFix.replace(/--canvas:#F6F1EA; --surface:#FFFDFA; --surface-raised:#FFFFFF; --surface-sunken:#F1EAE0;/g, '--canvas:#F9F7F4; --surface:#FFFFFF; --surface-raised:#FFFFFF; --surface-sunken:#F5F3ED;');

fs.writeFileSync('src/theme-fix.css', themeFix);
