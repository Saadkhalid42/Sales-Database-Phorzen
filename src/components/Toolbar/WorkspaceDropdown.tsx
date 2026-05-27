import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, MoreVertical, Plus, Edit2, Trash2, Check, Users } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ActionDialog } from '../Shared/ActionDialog';
import { ICONS } from '../Shared/IconColorPicker';

export function WorkspaceDropdown({ asInlineMobile }: { asInlineMobile?: boolean }) {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWsId = useStore(state => state.activeWorkspaceId);
  const setActiveWsId = useStore(state => state.setActiveWorkspaceId);
  const updateWorkspace = useStore(state => state.updateWorkspace);
  const deleteWorkspace = useStore(state => state.deleteWorkspace);
  const addWorkspace = useStore(state => state.addWorkspace);
  const currentUser = useStore(state => state.currentUser);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const allWorkspaces = activeDb?.workspaces || [];
  
  const workspaces = allWorkspaces.filter(ws => {
    if (currentUser?.role?.toLowerCase() === 'admin') return true;
    return !ws.ownerId || ws.ownerId === currentUser?.id;
  });
  const activeWs = workspaces.find(ws => ws.id === activeWsId) || workspaces[0];
  const ActiveIcon = activeWs?.iconName && ICONS[activeWs.iconName] ? ICONS[activeWs.iconName] : Users;
  
  const canAddWorkspace = currentUser?.role?.toLowerCase() === 'admin' || !!currentUser?.permissions?.can_create_workspaces;

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'add' | 'rename' | 'delete';
    targetId?: string;
    targetName?: string;
    iconName?: string;
    iconColor?: string;
  }>({ isOpen: false, type: 'add' });

  const handleConfirm = (val: string, icon?: string, color?: string) => {
    if (dialogConfig.type === 'add') {
      addWorkspace({ id: `ws-${Date.now()}`, name: val, iconName: icon || 'Briefcase', iconColor: color || '#3b82f6' });
    } else if (dialogConfig.type === 'rename' && dialogConfig.targetId) {
      updateWorkspace(dialogConfig.targetId, val, icon, color);
    } else if (dialogConfig.type === 'delete' && dialogConfig.targetId) {
      deleteWorkspace(dialogConfig.targetId);
    }
  };

  const openAdd = () => setDialogConfig({ isOpen: true, type: 'add' });
  const openRename = (ws: any) => setDialogConfig({ 
    isOpen: true, type: 'rename', targetId: ws.id, targetName: ws.name, iconName: ws.iconName, iconColor: ws.iconColor 
  });
  const openDelete = (ws: any) => setDialogConfig({ isOpen: true, type: 'delete', targetId: ws.id, targetName: ws.name });

  const renderInlineList = () => (
    <div className="flex flex-col w-full">
      {workspaces.map(ws => {
        const WsIcon = ws.iconName && ICONS[ws.iconName] ? ICONS[ws.iconName] : Users;
        return (
          <div key={ws.id} className="relative group">
            <button
              className="flex w-full items-center justify-between cursor-pointer px-3 py-2 rounded-2xl text-text-primary hover:bg-accent-subtle hover:text-accent outline-none pr-10"
              onClick={() => setActiveWsId(ws.id)}
            >
              <span className="flex items-center gap-2 truncate">
                <WsIcon size={16} color={ws.iconColor || 'currentColor'} />
                <span className="truncate">{ws.name}</span>
              </span>
              {activeWsId === ws.id && <Check size={16} className="text-primary flex-shrink-0" />}
            </button>
            
            {(currentUser?.role?.toLowerCase() === 'admin' || ws.ownerId === currentUser?.id) && <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="p-1 rounded hover:bg-divider text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                    <MoreVertical size={16} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="mobile-bottom-sheet bg-surface-raised min-w-[140px] border border-border rounded-lg p-1 shadow-xl z-[60]" sideOffset={4} align="end">
                    <DropdownMenu.Item 
                      className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-2xl text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-sm"
                      onSelect={() => setDialogConfig({ isOpen: true, type: 'rename', targetId: ws.id, targetName: ws.name, iconName: ws.iconName, iconColor: ws.iconColor })}
                    >
                      <Edit2 size={14} /> Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item 
                      className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-2xl text-red-600 data-[highlighted]:bg-red-600 data-[highlighted]:text-accent outline-none text-sm"
                      onSelect={() => setDialogConfig({ isOpen: true, type: 'delete', targetId: ws.id, targetName: ws.name })}
                    >
                      <Trash2 size={14} /> Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>}
          </div>
        );
      })}
      
      {canAddWorkspace && (
        <>
          <div className="h-px bg-divider my-1" />
          
          <button 
            className="flex w-full items-center gap-2 cursor-pointer px-3 py-2 rounded-2xl text-accent font-medium hover:bg-accent-subtle hover:text-accent outline-none"
            onClick={() => setDialogConfig({ isOpen: true, type: 'add' })}
          >
            <Plus size={16} /> Add Workspace
          </button>
        </>
      )}
    </div>
  );

  if (asInlineMobile) {
    return (
      <>
        {renderInlineList()}
        <ActionDialog
          isOpen={dialogConfig.isOpen}
          onOpenChange={(open) => setDialogConfig(prev => ({ ...prev, isOpen: open }))}
          title={dialogConfig.type === 'add' ? 'Add Workspace' : dialogConfig.type === 'rename' ? 'Rename Workspace' : 'Delete Workspace'}
          description={dialogConfig.type === 'delete' ? `Are you sure you want to delete "${dialogConfig.targetName}"?` : undefined}
          defaultValue={dialogConfig.type === 'rename' ? dialogConfig.targetName : ''}
          requiresInput={dialogConfig.type !== 'delete'}
          isDestructive={dialogConfig.type === 'delete'}
          requiresIconColor={dialogConfig.type === 'add' || dialogConfig.type === 'rename'}
          defaultIcon={dialogConfig.iconName || 'Briefcase'}
          defaultColor={dialogConfig.iconColor || '#3b82f6'}
          confirmText={dialogConfig.type === 'add' ? 'Create' : dialogConfig.type === 'rename' ? 'Rename' : 'Delete'}
          onConfirm={handleConfirm}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center justify-center p-2.5 rounded-[16px] text-text-primary bg-surface-raised border border-divider shadow-sm hover:shadow-md hover:text-accent transition-all focus:outline-none focus:ring-2 focus:ring-focus-ring">
            <ActiveIcon size={16} color={activeWs?.iconColor || 'currentColor'} className="flex-shrink-0" />
            
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="bg-surface-raised w-56 border border-border shadow-xl rounded-xl p-2 z-50 mt-1 data-[state=open]:animate-dropdown-in data-[state=closed]:animate-dropdown-out"
            align="start"
            sideOffset={4}
            
          >
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Workspaces
            </div>
            
            {workspaces.map(ws => {
              const WsIcon = ws.iconName && ICONS[ws.iconName] ? ICONS[ws.iconName] : Users;
              return (
                <div key={ws.id} className="relative group">
                  <DropdownMenu.Item
                    className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-2xl text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none pr-10"
                    onSelect={() => setActiveWsId(ws.id)}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <WsIcon size={16} color={ws.iconColor || 'currentColor'} />
                      <span className="truncate">{ws.name}</span>
                    </span>
                    {activeWsId === ws.id && <Check size={16} className="text-primary flex-shrink-0" />}
                  </DropdownMenu.Item>
                  
                  {(currentUser?.role?.toLowerCase() === 'admin' || ws.ownerId === currentUser?.id) && <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
                            onSelect={() => setDialogConfig({ isOpen: true, type: 'rename', targetId: ws.id, targetName: ws.name, iconName: ws.iconName, iconColor: ws.iconColor })}
                          >
                            <Edit2 size={14} /> Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Item 
                            className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-2xl text-red-600 data-[highlighted]:bg-red-600 data-[highlighted]:text-accent outline-none text-sm"
                            onSelect={() => setDialogConfig({ isOpen: true, type: 'delete', targetId: ws.id, targetName: ws.name })}
                          >
                            <Trash2 size={14} /> Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>}
                </div>
              );
            })}
            
            {canAddWorkspace && (
              <>
                <DropdownMenu.Separator className="h-px bg-divider my-1" />
                
                <DropdownMenu.Item 
                  className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-2xl text-accent font-medium data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none"
                  onSelect={() => setDialogConfig({ isOpen: true, type: 'add' })}
                >
                  <Plus size={16} /> Add Workspace
                </DropdownMenu.Item>
              </>
            )}

          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ActionDialog
        isOpen={dialogConfig.isOpen}
        onOpenChange={(open) => setDialogConfig(prev => ({ ...prev, isOpen: open }))}
        title={dialogConfig.type === 'add' ? 'Add Workspace' : dialogConfig.type === 'rename' ? 'Rename Workspace' : 'Delete Workspace'}
        description={dialogConfig.type === 'delete' ? `Are you sure you want to delete "${dialogConfig.targetName}"?` : undefined}
        defaultValue={dialogConfig.type === 'rename' ? dialogConfig.targetName : ''}
        requiresInput={dialogConfig.type !== 'delete'}
        isDestructive={dialogConfig.type === 'delete'}
        requiresIconColor={dialogConfig.type === 'add' || dialogConfig.type === 'rename'} // Enforce icon selection when adding/renaming
        defaultIcon={dialogConfig.iconName || 'Briefcase'}
        defaultColor={dialogConfig.iconColor || '#3b82f6'}
        confirmText={dialogConfig.type === 'add' ? 'Create' : dialogConfig.type === 'rename' ? 'Rename' : 'Delete'}
        onConfirm={handleConfirm}
      />
    </>
  );
}
