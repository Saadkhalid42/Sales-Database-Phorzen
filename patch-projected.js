import fs from 'fs';
const file = 'src/hooks/useProjectedData.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /      filtered = filtered\.filter\(r => \{\n\s*return activeFilters\.every\(f => \{/;
const replacement = `      filtered = filtered.filter(r => {
        const evaluateSingleFilter = (f) => {`;

code = code.replace(regex, replacement);

const regexEnd = /          \}\n\s*\}\);\n\s*\}\);/;
const replacementEnd = `          }
        };
        const operator = currentView?.filterJoinOperator || 'and';
        return operator === 'or' 
          ? activeFilters.some(evaluateSingleFilter) 
          : activeFilters.every(evaluateSingleFilter);
      });`;

code = code.replace(regexEnd, replacementEnd);

fs.writeFileSync(file, code);
