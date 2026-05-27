import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, Check, Search } from 'lucide-react';

interface SearchableColumnSelectorProps {
  value: string;
  onValueChange: (val: string) => void;
  columns: any[];
  className?: string;
  disabled?: boolean;
}

export function SearchableColumnSelector({ 
  value, 
  onValueChange, 
  columns,
  disabled,
  className = "w-1/3 flex items-center justify-between px-2 py-1.5 rounded-2xl border border-border bg-surface text-text-primary text-xs focus:outline-none focus:border-primary transition-colors"
}: SearchableColumnSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  
  const selectedCol = columns.find(c => c.key === value);
  
  const filteredCols = React.useMemo(() => {
    if (!query.trim()) return columns;
    const q = query.toLowerCase();
    return columns.filter(c => c.label.toLowerCase().includes(q));
  }, [columns, query]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className={className} disabled={disabled}>
          <span className="truncate">{selectedCol ? selectedCol.label : 'Select...'}</span>
          <ChevronDown size={14} className="opacity-50 flex-shrink-0" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="z-[60] w-[200px] border border-border shadow-xl rounded-lg p-2 mt-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 flex flex-col gap-2"
          
          align="start"
          sideOffset={4}
        >
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border bg-surface">
            <Search size={14} className="text-text-muted flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Search columns..." 
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-text-primary focus:outline-none min-w-0"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar -mx-1 px-1">
            {filteredCols.map(c => (
              <button
                key={c.key}
                onClick={() => {
                  onValueChange(c.key);
                  setOpen(false);
                  setQuery('');
                }}
                className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-2xl cursor-pointer select-none text-left w-full outline-none transition-colors ${
                  value === c.key 
                    ? 'bg-accent text-white' 
                    : 'text-text-primary hover:bg-accent/10'
                }`}
              >
                {value === c.key ? <Check size={12} className="shrink-0" /> : <div className="w-3 shrink-0" />}
                <span className="truncate">{c.label}</span>
              </button>
            ))}
            {filteredCols.length === 0 && (
              <div className="text-xs text-text-primary opacity-50 py-2 text-center">No columns found</div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
