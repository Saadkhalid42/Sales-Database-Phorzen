import fs from 'fs';
const file = 'src/components/Grid/Cells/CellText.tsx';
let code = fs.readFileSync(file, 'utf8');

const regexLayout = /useLayoutEffect\(\(\) => \{[\s\S]*?\}, \[localValue, isEditing, isLongText\]\);/;
const replacementLayout = `useLayoutEffect(() => {
  if (isEditing && isLongText && textareaRef.current) {
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = \`\${textareaRef.current.scrollHeight + 4}px\`;
  }
}, [localValue, isEditing, isLongText]);`;

code = code.replace(regexLayout, replacementLayout);

const regexRender = /<textarea[\s\S]*?rows=\{1\}\n\s*\/>/;
const replacementRender = `<textarea
  ref={textareaRef}
  value={localValue}
  onChange={(e) => setLocalValue(e.target.value)}
  onBlur={onBlur}
  style={{
    position: 'absolute',
    top: '-2px',
    left: '-2px',
    width: '200%', // Expands twice its size horizontally
    minWidth: '350px', // Hard minimum width
    minHeight: '100px',
    height: 'auto',
    zIndex: 9999, // Escapes grid context
    backgroundColor: 'var(--bg-color, white)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    border: '2px solid #2135a6',
    borderRadius: '6px',
    padding: '8px',
    resize: 'none',
    overflow: 'hidden'
  }}
/>`;

code = code.replace(regexRender, replacementRender);

fs.writeFileSync(file, code);
