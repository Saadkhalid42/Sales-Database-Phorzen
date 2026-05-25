import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as Popover from '@radix-ui/react-popover';
import { X, ChevronDown, Check, Type, AlignLeft, Hash, Calendar, CheckSquare, Star, Mail, Phone, Link2, List, Clock, File as FileIcon, CalendarDays, Plus, Trash2, GripVertical } from 'lucide-react';

const PASTEL_COLORS = [
  '#ffdbdc', '#ffdfc9', '#ffecc7', '#dcf1d4', '#d5f0fa',
  '#dfd8fd', '#f4dced', '#f5e5e6', '#e4f3e6', '#d6e6f2',
  '#ffdce0', '#ffe6d5', '#fff4ce', '#d4ebd0', '#c8e7fa'
];
import { useStore } from '../../store/useStore';
import type { GridColumn } from '../../store/useStore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EditFieldDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  column: GridColumn;
}

const FIELD_TYPES = [
  { id: 'single_line_text', label: 'Single Line Text', icon: Type },
  { id: 'long_text', label: 'Long Text', icon: AlignLeft },
  { id: 'number', label: 'Number', icon: Hash },
  { id: 'date', label: 'Date', icon: Calendar },
  { id: 'boolean', label: 'Boolean', icon: CheckSquare },
  { id: 'rating', label: 'Rating', icon: Star },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone_number', label: 'Phone', icon: Phone },
  { id: 'url', label: 'URL', icon: Link2 },
  { id: 'single_select', label: 'Single Select', icon: List },
  { id: 'multiple_select', label: 'Multiple Select', icon: List },
  { id: 'duration', label: 'Duration', icon: Clock },
  { id: 'file', label: 'File', icon: FileIcon },
  { id: 'created_on', label: 'Created On', icon: CalendarDays }
];


interface SortableOptionItemProps {
  opt: any;
  idx: number;
  updateOption: (idx: number, key: string, value: any) => void;
  deleteOption: (idx: number) => void;
}

function SortableOptionItem({ opt, idx, updateOption, deleteOption }: SortableOptionItemProps) {
  const id = opt.label || `opt-${idx}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 bg-surface p-1 rounded-lg ${isDragging ? 'relative' : ''}`}>
      <button 
        type="button" 
        {...attributes} 
        {...listeners} 
        className="text-text-muted hover:text-slate-600 cursor-grab active:cursor-grabbing p-1 focus:outline-none"
      >
        <GripVertical size={14} />
      </button>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button 
            type="button" 
            className="w-8 h-8 rounded cursor-pointer border border-border shadow-sm flex-shrink-0 transition-transform hover:scale-105"
            style={{ backgroundColor: opt.color || '#cbd5e1' }}
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content 
            className="w-[180px] border border-border shadow-2xl rounded-xl p-3 z-[2000] bg-surface-raised data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            sideOffset={8}
            align="start"
          >
            <div className="grid grid-cols-5 gap-2">
              {PASTEL_COLORS.map(c => (
                <Popover.Close asChild key={c}>
                  <button
                    type="button"
                    onClick={() => updateOption(idx, 'color', c)}
                    className={`w-6 h-6 rounded-md border-2 transition-transform ${opt.color === c ? 'scale-110 border-accent' : 'border-transparent hover:scale-110 hover:shadow-sm'}`}
                    style={{ backgroundColor: c }}
                  />
                </Popover.Close>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <input
        type="text"
        value={opt.label}
        onChange={e => updateOption(idx, 'label', e.target.value)}
        className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary text-sm"
      />
      <button 
        type="button" 
        onClick={() => {
          useStore.getState().openConfirmModal(
            'Delete Option',
            `Are you sure you want to delete the "${opt.label}" option?`,
            () => deleteOption(idx)
          );
        }}
        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function EditFieldDialog({ isOpen, onOpenChange, column }: EditFieldDialogProps) {
  const changeColumnType = useStore(state => state.changeColumnType);
  const updateColumn = useStore(state => state.updateColumn);

  const [label, setLabel] = useState(column?.label || '');
  const [type, setType] = useState(column.type);
  const [typeOptions, setTypeOptions] = useState<Record<string, any>>(column.typeOptions || {});

  // Reset local state when dialog opens or column changes
  useEffect(() => {
    if (isOpen) {
      setLabel(column.label);
      setType(column.type);
      setTypeOptions(column.typeOptions || {});
    }
  }, [isOpen, column]);

  const handleSave = async () => {
    // If the type changed, we run the deep conversion action
    if (type !== column.type || JSON.stringify(typeOptions) !== JSON.stringify(column.typeOptions)) {
      
      let finalDateContext = undefined;
      
      if (type === 'date' && type !== column.type) {
         // Check if dates are ambiguous
         const state = useStore.getState();
         const db = state.databases.find(d => d.id === state.activeDatabaseId);
         if (db) {
             const rawValues = db.records.map(r => r.cells[column.key]).filter(v => v !== null && v !== undefined && String(v).trim() !== '');
             if (rawValues.length > 0) {
                 // We will check the first valid value for the sample
                 const sample = String(rawValues[0]);
                 const { analyzeDateColumn } = await import('../../utils/DataEngine');
                 const context = analyzeDateColumn(rawValues);
                 
                 // If ambiguous or just as a safety net for non-ISO (we can prompt if it's not a standard ISO string)
                 if (context === 'AMBIGUOUS' || !sample.includes('T')) {
                     const interceptResult = await state.openDateIntercept(sample);
                     if (!interceptResult) {
                         // User cancelled
                         return;
                     }
                     finalDateContext = interceptResult.sourceFormat;
                     // Update display format as well
                     typeOptions.dateFormat = interceptResult.displayFormat;
                 }
             }
         }
      }

      changeColumnType(column.key, type, typeOptions, finalDateContext);
    }
    
    // Always apply label updates if changed
    if (label !== column.label) {
      updateColumn(column.key, { label });
    }
    
    onOpenChange(false);
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    // Initialize default options for new types if needed
    if (newType === 'date' && !typeOptions.dateFormat) {
      setTypeOptions({ ...typeOptions, dateFormat: 'MM/DD/YYYY' });
    } else if (newType === 'number' && typeOptions.allowDecimals === undefined) {
      setTypeOptions({ ...typeOptions, allowDecimals: false, decimalPlaces: 0 });
    } else if (newType === 'rating' && !typeOptions.maxStars) {
      setTypeOptions({ ...typeOptions, maxStars: 5 });
    } else if (newType === 'duration' && !typeOptions.durationFormat) {
      setTypeOptions({ ...typeOptions, durationFormat: 'h:mm' });
    }
    // Note: Options for select types are generated natively in the changeColumnType store action
  };

  const updateTypeOption = (key: string, value: any) => {
    setTypeOptions(prev => {
      const newOpts = { ...prev, [key]: value };
      updateColumn(column.key, { typeOptions: newOpts });
      return newOpts;
    });
  };

  const handleUpdateOption = (idx: number, key: string, value: any) => {
    const newOpts = [...(typeOptions.options || [])];
    newOpts[idx] = { ...newOpts[idx], [key]: value };
    updateTypeOption('options', newOpts);
  };

  const handleDeleteOption = (idx: number) => {
    const newOpts = [...(typeOptions.options || [])];
    newOpts.splice(idx, 1);
    updateTypeOption('options', newOpts);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const opts = typeOptions.options || [];
      const oldIndex = opts.findIndex((o: any, idx: number) => (o.label || `opt-${idx}`) === active.id);
      const newIndex = opts.findIndex((o: any, idx: number) => (o.label || `opt-${idx}`) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        updateTypeOption('options', arrayMove(opts, oldIndex, newIndex));
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut z-[100] " />
        <Dialog.Content 
          className="bg-surface-raised fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] z-[101] flex flex-col gap-5 border border-border"
          
        >
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-lg font-bold text-text-primary">
              Edit Field
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-text-primary opacity-50 hover:opacity-100 focus:outline-none p-1 rounded hover:bg-[rgba(var(--text-color),0.05)] transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar p-1">
            {/* Field Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary opacity-80">Field Name</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
              />
            </div>

            {/* Field Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary opacity-80">Field Type</label>
              <Select.Root value={type} onValueChange={handleTypeChange}>
                <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown size={16} className="opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-[110] overflow-hidden bg-surface rounded-lg border border-border shadow-xl" position="popper" sideOffset={4}>
                    <Select.Viewport className="p-1 max-h-60 custom-scrollbar">
                      {FIELD_TYPES.map(t => {
                        const Icon = t.icon;
                        return (
                          <Select.Item key={t.id} value={t.id} className="relative flex items-center gap-2 px-8 py-2 text-sm text-text-primary rounded-md cursor-pointer select-none data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent data-[highlighted]:outline-none">
                            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                              <Check size={14} />
                            </Select.ItemIndicator>
                            <Icon size={14} />
                            <Select.ItemText>{t.label}</Select.ItemText>
                          </Select.Item>
                        );
                      })}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Dynamic Config Area */}
            <div className="flex flex-col gap-1.5 mt-2">
              {(type === 'single_select' || type === 'multiple_select') && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-primary opacity-80">Options</label>
                  <div className="flex flex-col gap-2">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={(typeOptions.options || []).map((o: any, idx: number) => o.label || `opt-${idx}`)} strategy={verticalListSortingStrategy}>
                        {(typeOptions.options || []).map((opt: any, idx: number) => (
                          <SortableOptionItem 
                            key={opt.label || `opt-${idx}`} 
                            opt={opt} 
                            idx={idx} 
                            updateOption={handleUpdateOption} 
                            deleteOption={handleDeleteOption} 
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                    <button 
                      onClick={() => {
                        const newOpts = [...(typeOptions.options || [])];
                        newOpts.push({ label: `Option ${newOpts.length + 1}`, color: PASTEL_COLORS[newOpts.length % PASTEL_COLORS.length] });
                        updateTypeOption('options', newOpts);
                      }}
                      className="flex items-center gap-1.5 text-sm text-accent hover:bg-accent-subtle px-3 py-1.5 rounded-md self-start transition-colors mt-1"
                    >
                      <Plus size={14} /> Add an option
                    </button>
                  </div>
                </div>
              )}

              {type === 'date' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary opacity-80">Date Format</label>
                  <Select.Root value={typeOptions.dateFormat || 'MM/DD/YYYY'} onValueChange={v => updateTypeOption('dateFormat', v)}>
                    <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm">
                      <Select.Value />
                      <Select.Icon><ChevronDown size={16} className="opacity-50" /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="z-[110] overflow-hidden bg-surface rounded-lg border border-border shadow-xl" position="popper" sideOffset={4}>
                        <Select.Viewport className="p-1">
                          {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'Month D, YYYY'].map(fmt => (
                            <Select.Item key={fmt} value={fmt} className="relative flex items-center gap-2 px-8 py-2 text-sm text-text-primary rounded-md cursor-pointer select-none data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent data-[highlighted]:outline-none">
                              <Select.ItemIndicator className="absolute left-2"><Check size={14} /></Select.ItemIndicator>
                              <Select.ItemText>{fmt}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              )}

              {type === 'number' && (
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!typeOptions.allowDecimals} 
                      onChange={e => updateTypeOption('allowDecimals', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    Allow Decimals
                  </label>
                  {typeOptions.allowDecimals && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-text-primary opacity-80">Decimal Places</label>
                      <input 
                        type="number" 
                        min="1" max="10"
                        value={typeOptions.decimalPlaces || 2}
                        onChange={e => updateTypeOption('decimalPlaces', parseInt(e.target.value) || 2)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {type === 'rating' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary opacity-80">Max Stars</label>
                  <input 
                    type="number" 
                    min="1" max="10"
                    value={typeOptions.maxStars || 5}
                    onChange={e => updateTypeOption('maxStars', Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              )}

              {type === 'duration' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary opacity-80">Duration Format</label>
                  <Select.Root value={typeOptions.durationFormat || 'h:mm'} onValueChange={v => updateTypeOption('durationFormat', v)}>
                    <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm">
                      <Select.Value />
                      <Select.Icon><ChevronDown size={16} className="opacity-50" /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="z-[110] overflow-hidden bg-surface rounded-lg border border-border shadow-xl" position="popper" sideOffset={4}>
                        <Select.Viewport className="p-1">
                          {['h:mm', 'h:mm:ss'].map(fmt => (
                            <Select.Item key={fmt} value={fmt} className="relative flex items-center gap-2 px-8 py-2 text-sm text-text-primary rounded-md cursor-pointer select-none data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent data-[highlighted]:outline-none">
                              <Select.ItemIndicator className="absolute left-2"><Check size={14} /></Select.ItemIndicator>
                              <Select.ItemText>{fmt}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              )}
            </div>

          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-[rgba(var(--text-color),0.05)] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-on-accent hover:bg-accent-hover transition-colors shadow-md"
            >
              Save Field
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
