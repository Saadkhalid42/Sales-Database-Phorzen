import * as Dialog from '@radix-ui/react-dialog';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { X, Table, LayoutGrid } from 'lucide-react';
import { useState, useEffect } from 'react';
import { IconColorPicker } from './IconColorPicker';

export interface ActionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  defaultValue?: string;
  
  // Icon/Color requirements
  requiresIconColor?: boolean;
  defaultIcon?: string;
  defaultColor?: string;
  
  // View Type selector
  showViewTypeSelector?: boolean;
  defaultViewType?: 'grid' | 'card';
  
  // Adjusted callback
  onConfirm: (val: string, icon?: string, color?: string, viewType?: 'grid' | 'card') => void;
  
  confirmText?: string;
  requiresInput?: boolean;
  isDestructive?: boolean;
}

export function ActionDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  defaultValue = '',
  requiresIconColor = false,
  defaultIcon = 'Database',
  defaultColor = '#3b82f6',
  showViewTypeSelector = false,
  defaultViewType = 'grid',
  onConfirm,
  confirmText = 'Confirm',
  requiresInput = true,
  isDestructive = false
}: ActionDialogProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [icon, setIcon] = useState(defaultIcon);
  const [color, setColor] = useState(defaultColor);
  const [viewType, setViewType] = useState(defaultViewType);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
      setIcon(defaultIcon);
      setColor(defaultColor);
      setViewType(defaultViewType);
    }
  }, [isOpen, defaultValue, defaultIcon, defaultColor, defaultViewType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresInput && !inputValue.trim()) return;
    
    if (requiresIconColor || showViewTypeSelector) {
      onConfirm(inputValue.trim(), icon, color, viewType);
    } else {
      onConfirm(inputValue.trim());
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut z-50 " />
        <Dialog.Content className="bg-surface-raised fixed left-[50%] top-[50%] z-[200] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-xl" >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-text-primary">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="text-sm text-text-secondary">
                {description}
              </Dialog.Description>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            
            {requiresIconColor && (
              <div className="flex items-center gap-3 mb-2">
                <IconColorPicker 
                  icon={icon} 
                  color={color} 
                  onChange={(i, c) => { setIcon(i); setColor(c); }} 
                />
                <span className="text-sm text-text-secondary">Choose an icon and color</span>
              </div>
            )}

            {requiresInput && (
              <input
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex h-10 w-full rounded-md border border-primary/30 bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter name..."
              />
            )}

            {showViewTypeSelector && (
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-sm font-semibold text-text-primary/80">View Format</span>
                <ToggleGroup.Root
                  type="single"
                  value={viewType}
                  onValueChange={(val) => { if (val) setViewType(val as any); }}
                  className="flex items-center bg-surface-sunken rounded-lg p-1 gap-1"
                >
                  <ToggleGroup.Item value="grid" className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-md text-primary/60 data-[state=on]:bg-white data-[state=on]:text-accent data-[state=on]:shadow-sm hover:text-primary transition-all">
                    <Table size={20} />
                    <span className="text-xs font-medium">Grid</span>
                  </ToggleGroup.Item>
                  <ToggleGroup.Item value="card" className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-md text-primary/60 data-[state=on]:bg-white data-[state=on]:text-accent data-[state=on]:shadow-sm hover:text-primary transition-all">
                    <LayoutGrid size={20} />
                    <span className="text-xs font-medium">Cards</span>
                  </ToggleGroup.Item>
                </ToggleGroup.Root>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="mt-2 inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-sunken focus:outline-none focus:ring-2 focus:ring-accent sm:mt-0 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={requiresInput && !inputValue.trim()}
                className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-background transition-colors focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 ${
                  isDestructive 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </form>
          
          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent disabled:pointer-events-none text-text-primary">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
