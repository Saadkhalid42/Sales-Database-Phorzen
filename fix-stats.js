import fs from 'fs';
const file = 'src/components/Grid/DataGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

const statsLogic = `  const selectionStats = useMemo(() => {
    if (!selIndices) return null;
    const { minRow, maxRow, minCol, maxCol } = selIndices;
    if (minRow === maxRow && minCol === maxCol) return null;

    let count = 0;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    let allNumbers = true;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const record = viewRecords[r];
        const colKey = visibleColumns[c].key;
        if (!record || !colKey) continue;
        
        const rawValue = record.cells[colKey];
        if (rawValue === null || rawValue === undefined || rawValue === '') continue;

        count++;
        
        const s = String(rawValue).replace(/[^\\d.\\-()]/g, '');
        let valStr = s.replace(/[()]/g, '');
        let isNegative = s.startsWith('(') && s.endsWith(')');
        const num = parseFloat(valStr);

        if (isNaN(num)) {
          allNumbers = false;
        } else {
          const finalNum = isNegative ? -num : num;
          sum += finalNum;
          if (finalNum < min) min = finalNum;
          if (finalNum > max) max = finalNum;
        }
      }
    }

    if (count === 0) return null;

    if (allNumbers) {
      return {
        count,
        sum: sum.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        avg: (sum / count).toLocaleString(undefined, { maximumFractionDigits: 2 }),
        min: min.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        max: max.toLocaleString(undefined, { maximumFractionDigits: 2 })
      };
    }
    return { count };
  }, [selIndices, viewRecords, visibleColumns]);

  // Global Paste Intercept`;

code = code.replace(/  \/\/ Global Paste Intercept/, statsLogic);

const renderLogic = `      </div>

      {selectionStats && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-lg shadow-xl flex items-center gap-4 px-4 py-2 text-sm font-medium border border-white/10 dark:bg-slate-800">
          <div className="flex gap-4">
            <span>Count: {selectionStats.count}</span>
            {selectionStats.sum !== undefined && (
              <>
                <span className="opacity-50">|</span>
                <span>Sum: {selectionStats.sum}</span>
                <span className="opacity-50">|</span>
                <span>Avg: {selectionStats.avg}</span>
                <span className="opacity-50">|</span>
                <span>Min: {selectionStats.min}</span>
                <span className="opacity-50">|</span>
                <span>Max: {selectionStats.max}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}`;

code = code.replace(/      <\/div>\n\n    <\/div>\n  \);\n\}/, renderLogic);

fs.writeFileSync(file, code);
