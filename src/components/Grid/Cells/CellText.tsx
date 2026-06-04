import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';

export interface CellProps {
  recordId: string;
  colKey: string;
  columnType: string;
  columnTypeOptions?: Record<string, any>;
  initialValue: any;
  isSelected: boolean;
  isActiveEditor: boolean;
  updateRecordCell: (recordId: string, colKey: string, value: any) => void;
  commitEdit: (val: any) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  handleDoubleClick: () => void;
  handleKeyDownWrapper: (e: React.KeyboardEvent, currentValue: any, setLocalValue: (v: any) => void) => void;
  isModalMode?: boolean;
  isMultiSelect?: boolean;
}

export const CellText = React.memo(function CellText(props: CellProps) {
  const { recordId, colKey, columnType, initialValue, isActiveEditor, isMultiSelect, isEditing, setIsEditing, updateRecordCell, handleDoubleClick, handleKeyDownWrapper, isModalMode } = props;
  
  const [localValue, setLocalValue] = useState(String(initialValue || ''));
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLongText = columnType === 'long_text';

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(String(initialValue || ''));
    }
  }, [initialValue, isEditing]);

  useLayoutEffect(() => {
    if (isEditing && isLongText && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 4}px`;
    }
  }, [localValue, isEditing, isLongText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      updateRecordCell(recordId, colKey, localValue);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    updateRecordCell(recordId, colKey, localValue);
    setIsEditing(false);
  };

  const isEmail = columnType === 'email';
  const isUrl = columnType === 'url';
  const isPassword = columnType === 'password';
  const isValidEmail = isEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localValue) : true;

  if (isModalMode) {
    if (isLongText) {
      return (
        <textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          onBlur={handleBlur}
          className="w-full bg-surface-sunken outline-none border border-border   rounded-lg resize-y min-h-[80px] text-[13px] text-text-primary px-3 py-3 custom-scrollbar transition-all"
          placeholder="Enter text..."
        />
      );
    }
    return (
      <input
        type={isPassword ? 'password' : 'text'}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
             e.preventDefault();
             e.currentTarget.blur();
          }
        }}
        onBlur={handleBlur}
        className={`w-full bg-surface-sunken outline-none border border-border   rounded-lg text-[13px] text-text-primary px-3 py-3 min-h-[44px] transition-all ${!isValidEmail ? 'text-red-500' : ''}`}
        placeholder="Enter text..."
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center px-3 py-2 text-[13px] text-text-primary ${isEditing && isLongText ? 'overflow-visible' : 'overflow-hidden'} select-none outline-none ${isActiveEditor && !isEditing ? (isMultiSelect ? 'z-20 bg-surface' : 'ring-inset ring-2 ring-accent z-20 bg-surface/50') : ''}`}
      onDoubleClick={handleDoubleClick}
      onKeyDown={(e) => !isEditing ? handleKeyDownWrapper(e, localValue, setLocalValue) : undefined}
      tabIndex={isEditing ? -1 : 0}
      style={{ left: 0, width: '100%' }}
    >
      {isEditing ? (
        isLongText ? (
          <textarea
            ref={textareaRef}
            autoFocus
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              width: '200%',
              minWidth: '350px',
              minHeight: '100px',
              height: 'auto',
              zIndex: 9999,
              backgroundColor: 'var(--surface)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              border: '2px solid var(--accent)',
              borderRadius: '6px',
              padding: '8px',
              resize: 'none',
              overflow: 'hidden'
            }}
          />
        ) : (
          <input
            ref={inputRef}
            autoFocus
            type={isPassword ? 'password' : 'text'}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, outline: '2px solid var(--accent)', outlineOffset: '-2px', borderRadius: 0, margin: 0, boxShadow: 'none', border: 'none' }}
            className={`bg-surface outline-none  px-3 text-text-primary rounded-none ${!isValidEmail ? 'text-red-500' : ''}`}
          />
        )
      ) : (
        <span className="truncate w-full text-text-primary/90">
          {isPassword ? '***' : isUrl && initialValue ? (
            <a href={String(initialValue)} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline cursor-pointer">
              {initialValue}
            </a>
          ) : (
            String(initialValue || '')
          )}
        </span>
      )}
    </div>
  );
});
