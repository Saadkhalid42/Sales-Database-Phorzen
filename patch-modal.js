import fs from 'fs';

let modal = fs.readFileSync('src/components/Grid/ExpandedRecordModal.tsx', 'utf8');

// Container
modal = modal.replace(/className="bg-surface-raised fixed top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 w-full max-w-4xl max-h-\[85vh\] h-\[85vh\] bg-surface rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden outline-none data-\[state=open\]:animate-in data-\[state=closed\]:animate-out data-\[state=closed\]:fade-out-0 data-\[state=open\]:fade-in-0 data-\[state=closed\]:zoom-out-95 data-\[state=open\]:zoom-in-95"/g, 'className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[85vh] h-[85vh] bg-surface-raised rounded-[24px] shadow-lg flex flex-col z-[100] overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"');

// Header
modal = modal.replace(/className="flex items-center justify-between px-6 py-4 border-b border-primary\/10 bg-surface shrink-0"/g, 'className="flex items-center justify-between px-8 py-6 shrink-0"');
modal = modal.replace(/className="text-xl font-bold text-text-primary truncate pr-4"/g, 'className="text-3xl font-bold text-text-primary truncate pr-4"');

// Left Side
modal = modal.replace(/col-span-2 overflow-y-auto custom-scrollbar p-6 space-y-6 relative/g, 'col-span-2 overflow-y-auto custom-scrollbar p-8 pt-0 space-y-8 relative');
modal = modal.replace(/text-sm font-semibold text-slate-600 dark:text-text-muted/g, 'text-[12px] uppercase font-bold text-text-muted tracking-wider');
modal = modal.replace(/border border-border rounded-md bg-surface overflow-hidden/g, 'rounded-xl bg-surface-sunken overflow-hidden');

// Right Side
modal = modal.replace(/col-span-1 bg-slate-50 border-l border-divider/g, 'col-span-1 bg-surface-sunken border-l border-divider');
modal = modal.replace(/text-sm font-bold text-slate-800 uppercase/g, 'text-sm font-bold text-text-primary uppercase');
modal = modal.replace(/text-sm text-slate-700/g, 'text-sm text-text-secondary');
modal = modal.replace(/font-semibold text-slate-900/g, 'font-semibold text-text-primary');
modal = modal.replace(/bg-slate-200/g, 'bg-divider');
modal = modal.replace(/bg-white border-2 border-divider/g, 'bg-surface-raised border border-divider shadow-sm');

fs.writeFileSync('src/components/Grid/ExpandedRecordModal.tsx', modal);
