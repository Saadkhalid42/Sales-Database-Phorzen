import React, { useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import { useDropzone } from 'react-dropzone';
import { X, FileText, Database as DbIcon, Upload, ChevronDown, Check, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';
import { useStore } from '../../store/useStore';
import type { Database, GridColumn, GridRecord } from '../../store/useStore';
import { getTimezoneFromPhone } from '../../lib/timezones';

interface DatabaseCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'choice' | 'preview';

interface ColumnMapping {
  originalKey: string;
  name: string;
  type: string;
  skip: boolean;
}

const FIELD_TYPES = [
  { value: 'single_line_text', label: 'Single Line Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'rating', label: 'Rating' },
  { value: 'email', label: 'Email' },
  { value: 'phone_number', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'single_select', label: 'Single Select' },
  { value: 'multiple_select', label: 'Multiple Select' },
  { value: 'duration', label: 'Duration' },
  { value: 'file', label: 'File' },
  { value: 'created_on', label: 'Created On' },
  { value: 'append_only_log', label: 'Append-Only Log' }
];

function generateUUID() {
  return 'id-' + Math.random().toString(36).substring(2, 15);
}

export function DatabaseCreationWizard({ open, onOpenChange }: DatabaseCreationWizardProps) {
  const addDatabase = useStore(state => state.addDatabase);
  const importDatabase = useStore(state => state.importDatabase);
  
  const [step, setStep] = useState<Step>('choice');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [dbName, setDbName] = useState('Imported Database');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  React.useEffect(() => {
    if (open) {
      setStep('choice');
      setParsedData([]);
      setMappings([]);
      setDbName('Imported Database');
    }
  }, [open]);

  const handleStartFromScratch = () => {
    addDatabase({ id: `db-${Date.now()}`, name: 'Untitled Database' });
    onOpenChange(false);
  };

  const handleFileSelect = (file: File) => {
    setDbName(file.name.replace('.csv', ''));

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        if (data.length === 0) return;

        const headers = results.meta.fields || [];
        const sampleRows = data.slice(0, 10);

        const initialMappings = headers.map(header => {
          return {
            originalKey: header,
            name: header,
            type: 'single_line_text',
            skip: false
          };
        });

        setParsedData(data);
        setMappings(initialMappings);
        setStep('preview');
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileSelect(acceptedFiles[0]);
      }
    }
  });

  const handleCreateDatabase = async () => {
    const activeMappings = mappings.filter(m => !m.skip);
    
    // Check date intercepts first
    const dateContexts = new Map<string, string>();
    const dateDisplayFormats = new Map<string, string>();
    const state = useStore.getState();
    const { analyzeDateColumn, convertValue } = await import('../../utils/DataEngine');

    for (const m of activeMappings) {
      if (m.type === 'date') {
         const rawValues = parsedData.map(row => row[m.originalKey]).filter(v => v !== null && v !== undefined && String(v).trim() !== '');
         if (rawValues.length > 0) {
            const sample = String(rawValues[0]);
            const context = analyzeDateColumn(rawValues);
            if (context === 'AMBIGUOUS' || !sample.includes('T')) {
                const interceptResult = await state.openDateIntercept(sample);
                if (!interceptResult) {
                   // User cancelled the entire import
                   return;
                }
                dateContexts.set(m.originalKey, interceptResult.sourceFormat);
                dateDisplayFormats.set(m.originalKey, interceptResult.displayFormat);
            }
         }
      }
    }

    // Generate Columns
    const columns: GridColumn[] = activeMappings.map(m => {
      const col: GridColumn = {
        key: m.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substring(2, 6),
        label: m.name,
        type: m.type,
        width: 150
      };

      if (m.type === 'single_select' || m.type === 'multiple_select') {
        col.typeOptions = [];
      } else if (m.type === 'date' && dateDisplayFormats.has(m.originalKey)) {
        col.typeOptions = { dateFormat: dateDisplayFormats.get(m.originalKey) };
      }

      return col;
    });

    // Map original keys to new column keys
    const originalToNewKey = new Map(activeMappings.map((m, idx) => [m.originalKey, columns[idx].key]));

    // Generate Records
    const records: GridRecord[] = parsedData.map(row => {
      const cells: Record<string, any> = {};
      let _timezone: string | null = null;
      
      activeMappings.forEach(m => {
        const newKey = originalToNewKey.get(m.originalKey)!;
        const rawVal = row[m.originalKey];
        
        const dateCtx = dateContexts.get(m.originalKey) || 'MDY';
        const { value } = convertValue(rawVal, m.type, dateCtx);
        cells[newKey] = value;

        if (!_timezone && (m.name.toLowerCase() === 'lead number' || m.name.toLowerCase() === 'personal number')) {
          if (rawVal) {
            const tz = getTimezoneFromPhone(String(rawVal));
            if (tz) _timezone = tz;
          }
        }
      });

      return {
        id: generateUUID(),
        cells,
        ...(_timezone ? { _timezone } : {})
      };
    });

    // Create full Database object
    const newDb: Database = {
      id: `db-${Date.now()}`,
      name: dbName,
      columns,
      records,
      workspaces: [
        {
          id: `ws-${Date.now()}`,
          name: 'Main Workspace',
          iconName: 'Layout',
          views: [
            {
              id: `v-${Date.now()}`,
              name: 'All Records',
              filters: [],
              sorts: [],
              hiddenFields: [],
              columnOrder: columns.map(c => c.key),
              isFilterDisabled: false
            }
          ]
        }
      ]
    };

    importDatabase(newDb);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60  z-50 animate-in fade-in" />
        <Dialog.Content 
          className="bg-surface-raised fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] max-h-[85vh] flex flex-col bg-surface rounded-xl shadow-2xl border border-border z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10">
            <div className="flex flex-col">
              <Dialog.Title asChild>
                <h2 className="text-lg font-semibold text-text-primary">
                  {step === 'choice' ? 'Create New Database' : 'Import Configuration'}
                </h2>
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Start from scratch or import a CSV file to create a new database.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md hover:bg-surface-sunken text-text-primary opacity-70 hover:opacity-100 transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {step === 'choice' && (
              <div className="grid grid-cols-2 gap-6 h-64">
                <button 
                  onClick={handleStartFromScratch}
                  className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-surface-sunken transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DbIcon size={32} className="text-accent" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-text-primary">Start from Scratch</h3>
                    <p className="text-sm text-text-primary opacity-60 mt-1">Create an empty database with default fields.</p>
                  </div>
                </button>

                <div 
                  {...getRootProps()}
                  className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl transition-all group cursor-pointer relative overflow-hidden outline-none ${
                    isDragActive 
                      ? 'border-accent bg-accent/10' 
                      : 'border-border hover:border-primary hover:bg-surface-sunken'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${isDragActive ? 'bg-accent/20' : 'bg-surface-sunken'}`}>
                    <Upload size={32} className="text-accent" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-text-primary">Import from CSV</h3>
                    <p className="text-sm text-text-primary opacity-60 mt-1">
                      {isDragActive ? 'Drop your CSV here...' : 'Upload or drag your data to get started instantly.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Database Name</label>
                  <input 
                    type="text" 
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text-primary focus:outline-none focus-visible:border-primary transition-colors"
                  />
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Schema Mapping</h3>
                  <div className="flex flex-col gap-3 md:gap-2 max-h-[60vh] md:max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {mappings.map((mapping, idx) => (
                      <div key={mapping.originalKey} className={`flex flex-col md:flex-row md:items-center gap-3 p-4 md:p-2 rounded-xl md:rounded-lg border transition-colors ${mapping.skip ? 'border-primary/10 opacity-50 bg-surface/50' : 'border-border bg-surface'}`}>
                        
                        {/* Mobile Keep Header */}
                        <div className="flex md:hidden items-center justify-end w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-primary opacity-70 font-medium">Keep</span>
                            <input 
                              type="checkbox"
                              checked={!mapping.skip}
                              onChange={(e) => {
                                const newM = [...mappings];
                                newM[idx].skip = !e.target.checked;
                                setMappings(newM);
                              }}
                              className="w-5 h-5 rounded border-border text-accent  accent-accent cursor-pointer"
                            />
                          </div>
                        </div>

                        <input 
                          type="text" 
                          value={mapping.name}
                          onChange={(e) => {
                            const newM = [...mappings];
                            newM[idx].name = e.target.value;
                            setMappings(newM);
                          }}
                          disabled={mapping.skip}
                          className="w-full md:flex-1 md:w-auto px-3 py-3 md:py-1.5 rounded-lg md:rounded bg-surface-sunken md:bg-transparent text-text-primary text-sm border md:border-b border-border md:border-transparent focus-visible:border-primary focus:outline-none disabled:opacity-50 min-h-[44px] md:min-h-0"
                        />
                        
                        <Select.Root 
                          value={mapping.type} 
                          onValueChange={(val) => {
                            const newM = [...mappings];
                            newM[idx].type = val;
                            setMappings(newM);
                          }}
                          disabled={mapping.skip}
                        >
                          <Select.Trigger className="w-full md:w-48 relative flex items-center px-3 py-3 md:py-1.5 rounded-lg md:rounded border border-border bg-surface text-text-primary text-sm md:text-xs focus:outline-none disabled:opacity-50 min-h-[44px] md:min-h-0">
                            <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap pr-8 text-left">
                              <Select.Value />
                            </span>
                            <Select.Icon asChild>
                              <div className="absolute right-3 md:right-2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                <ChevronDown size={16} className="opacity-50" />
                              </div>
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="z-[70] bg-surface border border-border rounded-md shadow-xl overflow-hidden mobile-bottom-sheet">
                              <Select.Viewport className="p-1">
                                {FIELD_TYPES.map(ft => (
                                  <Select.Item key={ft.value} value={ft.value} className="flex items-center justify-between pl-3 pr-3 py-2 md:py-1.5 text-sm md:text-xs text-text-primary rounded cursor-pointer data-[highlighted]:bg-accent-subtle data-[highlighted]:text-accent outline-none min-h-[44px] md:min-h-0">
                                    <Select.ItemText>{ft.label}</Select.ItemText>
                                    <Select.ItemIndicator><Check size={12} /></Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>

                        {/* Desktop Keep Checkbox */}
                        <div className="hidden md:flex items-center gap-2 px-2">
                          <span className="text-xs text-text-primary opacity-70 font-medium">
                            Keep
                          </span>
                          <input 
                            type="checkbox"
                            checked={!mapping.skip}
                            onChange={(e) => {
                              const newM = [...mappings];
                              newM[idx].skip = !e.target.checked;
                              setMappings(newM);
                            }}
                            className="w-3.5 h-3.5 rounded border-border text-accent  accent-accent cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Data Preview (First 5 Rows)</h3>
                  <div className="overflow-x-auto custom-scrollbar border border-border rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-text-primary bg-surface-sunken uppercase">
                        <tr>
                          {mappings.filter(m => !m.skip).map(m => (
                            <th key={m.originalKey} className="px-4 py-2 font-semibold border-b border-primary/10 whitespace-nowrap">
                              {m.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-primary/5 last:border-0 hover:bg-surface-sunken">
                            {mappings.filter(m => !m.skip).map(m => (
                              <td key={m.originalKey} className="px-4 py-2 text-text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                {String(row[m.originalKey] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {step === 'preview' && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-primary/10 bg-surface-sunken">
              <button 
                onClick={() => setStep('choice')}
                className="px-4 py-2 rounded-md text-sm font-medium text-text-primary hover:bg-surface-sunken transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleCreateDatabase}
                className="px-4 py-2 rounded-md text-sm font-medium bg-accent text-on-accent hover:bg-accent-hover flex items-center gap-2 transition-colors shadow-lg shadow-md"
              >
                Create Database <ArrowRight size={16} />
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
