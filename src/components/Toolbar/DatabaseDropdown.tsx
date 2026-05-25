import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Database as DatabaseIcon, MoreVertical, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ActionDialog } from '../Shared/ActionDialog';
import { DatabaseCreationWizard } from '../Database/DatabaseCreationWizard';
import { Upload } from 'lucide-react';

export function DatabaseDropdown() {
  const databases = useStore(state => state.databases);
  const activeDbId = useStore(state => state.activeDatabaseId);
  const setActiveDbId = useStore(state => state.setActiveDatabaseId);
  const renameDatabase = useStore(state => state.renameDatabase);
  const deleteDatabase = useStore(state => state.deleteDatabase);
  const addDatabase = useStore(state => state.addDatabase);

  // Dialog States
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'add' | 'rename' | 'delete';
    targetId?: string;
    targetName?: string;
  }>({ isOpen: false, type: 'rename' });

  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleConfirm = (val: string) => {
    if (dialogConfig.type === 'rename' && dialogConfig.targetId) {
      renameDatabase(dialogConfig.targetId, val);
    } else if (dialogConfig.type === 'delete' && dialogConfig.targetId) {
      deleteDatabase(dialogConfig.targetId);
    }
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center justify-center p-2 rounded-lg text-text-primary hover:text-accent hover:bg-accent-subtle data-[state=open]:text-accent data-[state=open]:bg-accent-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring">
            <DatabaseIcon size={20} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="bg-surface-raised w-56 border border-border shadow-xl rounded-xl p-2 z-50 mt-1 data-[state=open]:animate-dropdown-in data-[state=closed]:animate-dropdown-out"
            align="start"
            sideOffset={4}
            
          >
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Databases
            </div>
            
            {databases.map(db => (
              <div key={db.id} className="relative group">
                <DropdownMenu.Item
                  className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-2xl text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none pr-10"
                  onSelect={() => setActiveDbId(db.id)}
                >
                  <span className="truncate">{db.name}</span>
                  {activeDbId === db.id && <Check size={16} className="text-primary flex-shrink-0" />}
                </DropdownMenu.Item>
                
                {/* 3-Dot Context Menu inside the item hover state */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="p-1 rounded hover:bg-divider text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className="mobile-bottom-sheet bg-surface-raised min-w-[140px] border border-border rounded-lg p-1 shadow-xl z-[60]" sideOffset={4} align="end" >
                        <DropdownMenu.Item 
                          className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-2xl text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-sm"
                          onSelect={() => setDialogConfig({ isOpen: true, type: 'rename', targetId: db.id, targetName: db.name })}
                        >
                          <Edit2 size={14} /> Rename
                        </DropdownMenu.Item>
                        <DropdownMenu.Item 
                          className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-2xl text-red-600 data-[highlighted]:bg-red-600 data-[highlighted]:text-accent outline-none text-sm"
                          onSelect={() => setDialogConfig({ isOpen: true, type: 'delete', targetId: db.id, targetName: db.name })}
                        >
                          <Trash2 size={14} /> Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
            ))}
            
            <DropdownMenu.Separator className="h-px bg-divider my-1" />
            
            <DropdownMenu.Item 
              className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-2xl text-accent font-medium data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none"
              onSelect={() => setIsWizardOpen(true)}
            >
              <Plus size={16} /> Add New Database
            </DropdownMenu.Item>


          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ActionDialog
        isOpen={dialogConfig.isOpen}
        onOpenChange={(open) => setDialogConfig(prev => ({ ...prev, isOpen: open }))}
        title={dialogConfig.type === 'rename' ? 'Rename Database' : 'Delete Database'}
        description={dialogConfig.type === 'delete' ? `Are you sure you want to delete "${dialogConfig.targetName}"? This action cannot be undone.` : undefined}
        defaultValue={dialogConfig.type === 'rename' ? dialogConfig.targetName : ''}
        requiresInput={dialogConfig.type !== 'delete'}
        isDestructive={dialogConfig.type === 'delete'}
        confirmText={dialogConfig.type === 'rename' ? 'Rename' : 'Delete'}
        onConfirm={handleConfirm}
      />

      <DatabaseCreationWizard 
        open={isWizardOpen} 
        onOpenChange={setIsWizardOpen} 
      />
    </>
  );
}
