import fs from 'fs';
const file = 'src/components/Grid/DataGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /  const columnVirtualizer = useVirtualizer\(\{[\s\S]*?\}\);/;
const match = code.match(regex);

if (match) {
  const newCode = match[0] + `

  const columnWidths = visibleColumns.map(c => c.width).join(',');
  useEffect(() => {
    if (columnVirtualizer.measure) {
      columnVirtualizer.measure();
    }
  }, [columnWidths, columnVirtualizer]);`;

  code = code.replace(regex, newCode);
  fs.writeFileSync(file, code);
} else {
  console.log("Could not find columnVirtualizer");
}

