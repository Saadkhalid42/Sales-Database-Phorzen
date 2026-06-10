import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, MoreVertical, Plus, Edit2, Trash2, Check, LayoutGrid, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ActionDialog } from '../Shared/ActionDialog';
import { ICONS } from '../Shared/IconColorPicker';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableViewItem({ view, activeViewId, setActiveViewId, setDialogConfig, duplicateView, asInlineMobile, currentUser }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: view.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const VIcon = view.iconName && ICONS[view.iconName] ? ICONS[view.iconName] : LayoutGrid;

  return (
    <div ref={setNodeRef} style={style} className="relative group flex items-center pr-10 hover:bg-[rgba(var(--text-color),0.02)] rounded-lg">
      <div {...attributes} {...listeners} className="cursor-grab p-2 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
        <GripVertical size={14} />
      </div>
      {asInlineMobile ? (
        <button
          className="flex-1 flex items-center justify-between cursor-pointer py-2 text-text-primary hover:bg-accent-subtle hover:text-accent outline-none rounded-lg px-1 w-full text-[13px]"
          onClick={() => setActiveViewId(view.id)}
        >
          <span className="flex items-center gap-2 truncate">
            <VIcon size={16} color={view.iconColor || 'currentColor'} className="flex-shrink-0"/>
            <span className="truncate">{view.name}</span>
          </span>
          {activeViewId === view.id && <Check size={16} className="text-primary flex-shrink-0 mr-2" />}
        </button>
      ) : (
        <DropdownMenu.Item
          className="flex-1 flex items-center justify-between cursor-pointer py-2 text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none rounded-lg px-1 text-[13px]"
          onSelect={() => setActiveViewId(view.id)}
        >
          <span className="flex items-center gap-2 truncate">
            <VIcon size={16} color={view.iconColor || 'currentColor'} className="flex-shrink-0"/>
            <span className="truncate">{view.name}</span>
          </span>
          {activeViewId === view.id && <Check size={16} className="text-primary flex-shrink-0 mr-2" />}
        </DropdownMenu.Item>
      )}
      
      {(currentUser?.role?.toLowerCase() === 'admin' || view.ownerId === currentUser?.id) && <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1 rounded hover:bg-divider text-text-secondary hover:text-text-primary focus:outline-none  ">
              <MoreVertical size={16} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="mobile-bottom-sheet bg-surface-raised min-w-[140px] border border-border rounded-lg p-1 shadow-xl z-[60]" sideOffset={4} align="end" >
              <DropdownMenu.Item 
                className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-[13px]"
                onSelect={() => setDialogConfig({ isOpen: true, type: 'rename', targetId: view.id, targetName: view.name, iconName: view.iconName, iconColor: view.iconColor })}
              >
                <Edit2 size={14} /> Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-text-primary data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none text-[13px]"
                onSelect={() => duplicateView(view.id)}
              >
                <Plus size={14} /> Duplicate View
              </DropdownMenu.Item>
              <DropdownMenu.Item 
                className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-red-600 data-[highlighted]:bg-red-600 data-[highlighted]:text-accent outline-none text-[13px]"
                onSelect={() => setDialogConfig({ isOpen: true, type: 'delete', targetId: view.id, targetName: view.name })}
              >
                <Trash2 size={14} /> Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>}
    </div>
  );
}

export function ViewDropdown({ asInlineMobile }: { asInlineMobile?: boolean }) {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWsId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const setActiveViewId = useStore(state => state.setActiveViewId);
  const updateView = useStore(state => state.updateView);
  const deleteView = useStore(state => state.deleteView);
  const duplicateView = useStore(state => state.duplicateView);
  const addView = useStore(state => state.addView);
  const reorderViews = useStore(state => state.reorderViews);

  const currentUser = useStore(state => state.currentUser);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWsId);
  const allWorkspaceViews = activeWs?.views || [];
  
  const workspaceViews = allWorkspaceViews.filter(v => {
    return !v.ownerId || v.ownerId === currentUser?.id;
  });
  
  const activeView = workspaceViews.find(v => v.id === activeViewId) || workspaceViews[0];
  const ActiveIcon = activeView?.iconName && ICONS[activeView.iconName] ? ICONS[activeView.iconName] : LayoutGrid;
  
  const canAddView = currentUser?.role?.toLowerCase() === 'admin' || !!currentUser?.permissions?.can_create_views;

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'add' | 'rename' | 'delete';
    targetId?: string;
    targetName?: string;
    iconName?: string;
    iconColor?: string;
  }>({ isOpen: false, type: 'add' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderViews(active.id as string, over.id as string);
    }
  };

  const handleConfirm = (val: string, icon?: string, color?: string, viewType?: 'grid' | 'card') => {
    if (dialogConfig.type === 'add') {
      addView({ id: `v-${Date.now()}`, name: val, iconName: icon || 'LayoutGrid', iconColor: color || '#10b981', viewType: viewType || 'grid' });
    } else if (dialogConfig.type === 'rename' && dialogConfig.targetId) {
      updateView(dialogConfig.targetId, { name: val, ...(icon && { iconName: icon }), ...(color && { iconColor: color }) });
    } else if (dialogConfig.type === 'delete' && dialogConfig.targetId) {
      deleteView(dialogConfig.targetId);
    }
  };

  const openAdd = () => setDialogConfig({ isOpen: true, type: 'add' });
  const openRename = (view: any) => setDialogConfig({ 
    isOpen: true, type: 'rename', targetId: view.id, targetName: view.name, iconName: view.iconName, iconColor: view.iconColor 
  });
  const openDelete = (view: any) => setDialogConfig({ isOpen: true, type: 'delete', targetId: view.id, targetName: view.name });

  const renderInlineList = () => (
    <div className="flex flex-col w-full">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={workspaceViews.map(v => v.id)} strategy={verticalListSortingStrategy}>
          {workspaceViews.map(view => (
            <SortableViewItem 
              key={view.id} 
              view={view} 
              activeViewId={activeViewId} 
              setActiveViewId={setActiveViewId} 
              setDialogConfig={setDialogConfig} 
              duplicateView={duplicateView} 
              asInlineMobile={true}
              currentUser={currentUser}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      {canAddView && (
        <>
          <div className="h-px bg-divider my-1" />
          
          <button 
            className="flex w-full items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-accent text-[13px] font-medium hover:bg-accent-subtle hover:text-accent outline-none"
            onClick={openAdd}
            disabled={!activeWsId}
          >
            <Plus size={16} /> Add View
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
          title={dialogConfig.type === 'add' ? 'Add View' : dialogConfig.type === 'rename' ? 'Rename View' : 'Delete View'}
          description={dialogConfig.type === 'delete' ? `Are you sure you want to delete "${dialogConfig.targetName}"?` : undefined}
          defaultValue={dialogConfig.type === 'rename' ? dialogConfig.targetName : ''}
          requiresInput={dialogConfig.type !== 'delete'}
          isDestructive={dialogConfig.type === 'delete'}
          requiresIconColor={dialogConfig.type === 'add' || dialogConfig.type === 'rename'}
          showViewTypeSelector={dialogConfig.type === 'add'}
          defaultIcon={dialogConfig.iconName || 'LayoutGrid'}
          defaultColor={dialogConfig.iconColor || '#10b981'}
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
          <button className="flex items-center justify-center px-2 py-1 rounded-md text-text-secondary hover:text-text-primary transition-all focus:outline-none">
            <ActiveIcon size={16} color={activeView?.iconColor || 'currentColor'} className="flex-shrink-0" />
            
            
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="bg-surface-raised w-64 border border-border shadow-xl rounded-md p-2 z-50 mt-1 data-[state=open]:animate-dropdown-in data-[state=closed]:animate-dropdown-out"
            align="start"
            sideOffset={4}
            
          >
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Workspace Views
            </div>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={workspaceViews.map(v => v.id)} strategy={verticalListSortingStrategy}>
                {workspaceViews.map(view => (
                  <SortableViewItem 
                    key={view.id} 
                    view={view} 
                    activeViewId={activeViewId} 
                    setActiveViewId={setActiveViewId} 
                    setDialogConfig={setDialogConfig} 
                    duplicateView={duplicateView} 
                    asInlineMobile={false}
                    currentUser={currentUser}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            {canAddView && (
              <>
                <DropdownMenu.Separator className="h-px bg-divider my-1" />
                
                <DropdownMenu.Item 
                  className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-accent text-[13px] font-medium data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none"
                  onSelect={openAdd}
                  disabled={!activeWsId}
                >
                  <Plus size={16} /> Add View
                </DropdownMenu.Item>
              </>
            )}

          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ActionDialog
        isOpen={dialogConfig.isOpen}
        onOpenChange={(open) => setDialogConfig(prev => ({ ...prev, isOpen: open }))}
        title={dialogConfig.type === 'add' ? 'Add View' : dialogConfig.type === 'rename' ? 'Rename View' : 'Delete View'}
        description={dialogConfig.type === 'delete' ? `Are you sure you want to delete "${dialogConfig.targetName}"?` : undefined}
        defaultValue={dialogConfig.type === 'rename' ? dialogConfig.targetName : ''}
        requiresInput={dialogConfig.type !== 'delete'}
        isDestructive={dialogConfig.type === 'delete'}
        requiresIconColor={dialogConfig.type === 'add' || dialogConfig.type === 'rename'}
        showViewTypeSelector={dialogConfig.type === 'add'}
        defaultIcon={dialogConfig.iconName || 'LayoutGrid'}
        defaultColor={dialogConfig.iconColor || '#10b981'}
        confirmText={dialogConfig.type === 'add' ? 'Create' : dialogConfig.type === 'rename' ? 'Rename' : 'Delete'}
        onConfirm={handleConfirm}
      />
    </>
  );
}
