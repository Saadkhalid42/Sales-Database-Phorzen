import fs from 'fs';

let content = fs.readFileSync('src/components/Grid/DataGrid.tsx', 'utf8');

// 1. Add store hooks
const hooksToAdd = `  const selectedRowIds = useStore(state => state.selectedRowIds) || [];
  const toggleRowSelection = useStore(state => state.toggleRowSelection);
  const clearRowSelection = useStore(state => state.clearRowSelection);
  const deleteRecords = useStore(state => state.deleteRecords);`;

content = content.replace(
  /const redo = useStore\(state => state\.redo\);/,
  `const redo = useStore(state => state.redo);\n${hooksToAdd}`
);

// 2. Row Index Cell
const oldRowIndexCell = `<span className={\`\${openMenuId === record.id ? 'hidden' : 'group-hover:hidden'} flex flex-col items-center justify-center\`}>
                      <span>{virtualRow.index + 1}</span>
                      {showTimezones && record._timezone && (
                        <span className="text-[9px] font-medium text-text-primary opacity-70 bg-[rgba(var(--text-color),0.05)] border border-[rgba(var(--text-color),0.1)] px-1 py-0.5 rounded leading-none mt-0.5">
                          {record._timezone}
                        </span>
                      )}
                    </span>
                    <div className={\`\${openMenuId === record.id ? 'flex' : 'hidden group-hover:flex'} items-center\`}>
                      <button 
                        onClick={() => openExpandedRecord(record.id)}
                        className="p-1 rounded-xl hover:bg-[rgba(var(--text-color),0.05)] text-text-primary focus:outline-none"
                      >
                        <Maximize2 size={14} />
                      </button>
                      <DropdownMenu.Root open={openMenuId === record.id} onOpenChange={(open) => setOpenMenuId(open ? record.id : null)}>
                        <DropdownMenu.Trigger asChild>
                          <button className="p-1 rounded-xl hover:bg-[rgba(var(--text-color),0.05)] text-text-primary focus:outline-none">
                            <MoreVertical size={14} />
                          </button>
                        </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content 
                          className="w-40 border border-border shadow-xl rounded-xl p-1 z-[100] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                          
                          sideOffset={4}
                          align="start"
                        >
                          <DropdownMenu.Item 
                            onSelect={() => {
                              const tsv = visibleColumns.map(c => record.cells[c.key] || '').join('\\t');
                              navigator.clipboard.writeText(tsv);
                            }}
                            className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-sm"
                          >
                            <Copy size={14} /> Copy Row
                          </DropdownMenu.Item>
                          <DropdownMenu.Item 
                            onSelect={() => {
                              const headers = visibleColumns.map(c => c.label).join('\\t');
                              const tsv = visibleColumns.map(c => record.cells[c.key] || '').join('\\t');
                              navigator.clipboard.writeText(headers + '\\n' + tsv);
                            }}
                            className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-sm"
                          >
                            <Copy size={14} /> Copy with Headers
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="h-px bg-divider my-1" />
                          <DropdownMenu.Item 
                            onSelect={() => deleteRecord(record.id)}
                            className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl text-danger data-[highlighted]:bg-danger-subtle data-[highlighted]:text-accent outline-none text-sm"
                          >
                            <Trash2 size={14} /> Delete Row
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>`;

const newRowIndexCell = `<div className="flex flex-col items-center justify-center w-full h-full relative group/checkbox">
                      <div className={\`absolute inset-0 flex items-center justify-center transition-opacity \${selectedRowIds?.includes(record.id) ? 'opacity-100' : 'opacity-0 group-hover/checkbox:opacity-100'}\`}>
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds?.includes(record.id) || false}
                          onChange={() => toggleRowSelection && toggleRowSelection(record.id)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                        />
                      </div>
                      <span className={\`flex flex-col items-center justify-center \${selectedRowIds?.includes(record.id) ? 'opacity-0' : 'group-hover/checkbox:opacity-0'} transition-opacity\`}>
                        <span>{virtualRow.index + 1}</span>
                      </span>
                    </div>`;

content = content.replace(oldRowIndexCell, newRowIndexCell);

// 3. Move Expand Icon to first column
// Wait, GridCell.tsx is where the cell is rendered. We can pass a prop or just render it over the GridCell in DataGrid.tsx
// Let's add it in DataGrid.tsx inside the virtualCol loop, if virtualCol.index === 0
const expandOverlay = `{virtualCol.index === 0 && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button 
                              onClick={(e) => { e.stopPropagation(); openExpandedRecord(record.id); }}
                              className="p-1 bg-surface-raised border border-border shadow-sm rounded hover:text-accent text-text-muted focus:outline-none"
                            >
                              <Maximize2 size={12} />
                            </button>
                          </div>
                        )}`;

content = content.replace(
  /<GridCell\n\s*recordId=\{record.id\}/g,
  `${expandOverlay}\n                        <GridCell\n                          recordId={record.id}`
);

// 4. Update multi-select styling
content = content.replace(
  /backgroundColor: 'rgba\\(var\\(--primary-color\\), 0\.08\\)'/g,
  `backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', boxShadow: 'inset 0 0 0 1px var(--accent)'`
);

// 5. Bulk Action Bar
const bulkActionBar = `
      {/* Bulk Action Bar */}
      {selectedRowIds && selectedRowIds.length > 0 && (
        <div className="fixed bottom-6 left-6 z-50 bg-surface-raised text-text-primary rounded-xl shadow-2xl flex items-center gap-4 p-2 border border-border animate-in slide-in-from-bottom-5" style={{ zIndex: 9999 }}>
          <div className="px-3 py-1 bg-accent-subtle text-accent rounded-lg text-sm font-bold">
            {selectedRowIds.length} Selected
          </div>
          <div className="w-px h-6 bg-divider" />
          <button 
            onClick={() => {
              const rows = viewRecords.filter(r => selectedRowIds.includes(r.id));
              const tsv = rows.map(r => visibleColumns.map(c => r.cells[c.key] || '').join('\\t')).join('\\n');
              navigator.clipboard.writeText(tsv);
              clearRowSelection && clearRowSelection();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-surface-sunken transition-colors"
          >
            <Copy size={16} /> Copy
          </button>
          <button 
            onClick={() => {
              const rows = viewRecords.filter(r => selectedRowIds.includes(r.id));
              const headers = visibleColumns.map(c => c.label).join('\\t');
              const tsv = rows.map(r => visibleColumns.map(c => r.cells[c.key] || '').join('\\t')).join('\\n');
              navigator.clipboard.writeText(headers + '\\n' + tsv);
              clearRowSelection && clearRowSelection();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-surface-sunken transition-colors"
          >
            <Copy size={16} /> Copy with Headers
          </button>
          <div className="w-px h-6 bg-divider" />
          <button 
            onClick={() => {
              if (deleteRecords) {
                deleteRecords(selectedRowIds);
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-danger hover:bg-danger-subtle transition-colors"
          >
            <Trash2 size={16} /> Delete
          </button>
          <div className="w-px h-6 bg-divider" />
          <button onClick={() => clearRowSelection && clearRowSelection()} className="p-1.5 hover:bg-surface-sunken rounded-lg text-text-muted">
            <X size={16} />
          </button>
        </div>
      )}`;

content = content.replace(
  /\{selectionStats && \(/,
  `${bulkActionBar}\n      {selectionStats && (`
);

fs.writeFileSync('src/components/Grid/DataGrid.tsx', content);

