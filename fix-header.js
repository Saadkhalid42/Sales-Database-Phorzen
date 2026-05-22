import fs from 'fs';
const file = 'src/components/Grid/ColumnHeader.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /      <\/DropdownMenu\.Root>\n\n      <EditFieldDialog/;

const resizeHandle = `      </DropdownMenu.Root>

      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-accent"
        style={{ width: '4px' }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX;
          const startWidth = col.width || 150;
          
          const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(50, startWidth + deltaX);
            // Throttle or direct update:
            updateColumn(col.key, { width: newWidth });
          };
          
          const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
          };
          
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
        }}
      />

      <EditFieldDialog`;

code = code.replace(regex, resizeHandle);

fs.writeFileSync(file, code);
