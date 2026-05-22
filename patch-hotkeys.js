import fs from 'fs';
const file = 'src/components/Grid/DataGrid.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /  const setSelectionRange = useStore\(state => state\.setSelectionRange\);/;
const replacement = `  const setSelectionRange = useStore(state => state.setSelectionRange);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Allow default behavior for normal typing, but intercept specific hotkeys
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);`;

code = code.replace(regex, replacement);

fs.writeFileSync(file, code);
