const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replaceRules = [
  { search: /text-slate-700/g, replace: 'text-[rgb(var(--text-color))]' },
  { search: /text-slate-600/g, replace: 'text-[rgb(var(--text-color))]' },
  { search: /hover:bg-slate-100/g, replace: 'hover:bg-[rgba(var(--text-color),0.08)]' }
];

walk('./src/components', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    replaceRules.forEach(rule => {
      content = content.replace(rule.search, rule.replace);
    });
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
});
