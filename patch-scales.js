import fs from 'fs';

const files = ['src/themes.css', 'src/theme-fix.css'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let css = fs.readFileSync(file, 'utf8');
  
  // Update scales
  css = css.replace(/--r-xs: ?6px;/g, '--r-xs: 8px;');
  css = css.replace(/--r-sm: ?8px;/g, '--r-sm: 12px;');
  css = css.replace(/--r-md: ?12px;/g, '--r-md: 16px;');
  css = css.replace(/--r-lg: ?16px;/g, '--r-lg: 24px;');
  
  // Soften Soft Light shadows (default theme)
  css = css.replace(/--shadow-sm:0 1px 3px rgba\(60,50,120,\.06\);/g, '--shadow-sm:0 4px 12px rgba(60,50,120,.03);');
  css = css.replace(/--shadow-md:0 8px 24px rgba\(60,50,120,\.12\);/g, '--shadow-md:0 16px 40px rgba(60,50,120,.06);');
  css = css.replace(/--shadow-lg:0 24px 52px rgba\(60,50,120,\.20\);/g, '--shadow-lg:0 32px 64px rgba(60,50,120,.10);');

  // Same for clinical light
  css = css.replace(/--shadow-sm:0 1px 2px rgba\(20,22,40,\.05\);/g, '--shadow-sm:0 4px 12px rgba(20,22,40,.03);');
  css = css.replace(/--shadow-md:0 8px 24px rgba\(20,22,40,\.12\);/g, '--shadow-md:0 16px 40px rgba(20,22,40,.06);');
  css = css.replace(/--shadow-lg:0 24px 52px rgba\(20,22,40,\.18\);/g, '--shadow-lg:0 32px 64px rgba(20,22,40,.10);');

  fs.writeFileSync(file, css);
}

