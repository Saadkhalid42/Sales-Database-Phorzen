import React, { useState, useEffect } from 'react';
import { CellText } from './Cells/CellText';
import { CellBoolean } from './Cells/CellBoolean';
import { CellDate } from './Cells/CellDate';
import { CellSelect } from './Cells/CellSelect';
import { CellNumber } from './Cells/CellNumber';
import { CellRating } from './Cells/CellRating';
import { CellReadOnly } from './Cells/CellReadOnly';
import { useStore } from '../../store/useStore';

interface GridCellProps {
  recordId: string;
  colKey: string;
  columnType: string;
  columnTypeOptions?: Record<string, any>;
  initialValue: any;
  isSelected: boolean;
  isActiveEditor: boolean;
  isMultiSelect?: boolean;
  isDragging?: boolean;
  checkIsMultiSelectLocked?: () => boolean;
  isModalMode?: boolean;
  updateRecordCell: (recordId: string, colKey: string, value: any) => void;
}

export function GridCell({ recordId, colKey, columnType, columnTypeOptions, initialValue, isSelected, isActiveEditor, isMultiSelect, isDragging, checkIsMultiSelectLocked, updateRecordCell, isModalMode }: GridCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isRemoteMutated = useStore(state => !!state.remoteMutations[`${recordId}_${colKey}`]);

  // If a cell stops being the active editor, exit edit mode.
  useEffect(() => {
    if (!isActiveEditor && isEditing) {
      setIsEditing(false);
    }
  }, [isActiveEditor]);

  const commitEdit = (val: any) => {
    if (val !== initialValue) {
      updateRecordCell(recordId, colKey, val);
    }
    setIsEditing(false);
  };

  const handleDoubleClick = () => {
    if (isMultiSelect || isDragging || (checkIsMultiSelectLocked && checkIsMultiSelectLocked())) return;
    if (isActiveEditor) {
      setIsEditing(true);
    }
  };

  const handleKeyDownWrapper = (e: React.KeyboardEvent, currentValue: any, setLocalValue: (v: any) => void) => {
    if (!isActiveEditor || isMultiSelect || isDragging || (checkIsMultiSelectLocked && checkIsMultiSelectLocked())) return;

    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit(currentValue);
      }
      return;
    }

    if (isSelected) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(true);
        return;
      }

      // If typing a printable character, replace value and enter edit mode
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setLocalValue(e.key);
        setIsEditing(true);
      }
    }
  };

  const sharedProps = {
    recordId,
    colKey,
    columnType,
    columnTypeOptions,
    initialValue,
    isSelected,
    isActiveEditor,
    updateRecordCell,
    isEditing,
    setIsEditing,
    commitEdit,
    handleDoubleClick,
    handleKeyDownWrapper,
    isModalMode
  };

  // Dispatcher Router
  let content = null;
  switch (columnType) {
    case 'boolean':
      content = <CellBoolean {...sharedProps} />;
      break;
    case 'date':
      content = <CellDate {...sharedProps} />;
      break;
    case 'single_select':
    case 'multiple_select':
      content = <CellSelect {...sharedProps} />;
      break;
    case 'number':
    case 'duration':
      content = <CellNumber {...sharedProps} />;
      break;
    case 'rating':
      content = <CellRating {...sharedProps} />;
      break;
    case 'single_line_text':
    case 'email':
    case 'url':
    case 'phone_number':
    case 'long_text':
      content = <CellText {...sharedProps} />;
      break;
    case 'created_on':
    case 'file':
    default:
      content = <CellReadOnly {...sharedProps} />;
      break;
  }
  
  return (
    <div className={`w-full h-full ${isRemoteMutated ? 'remote-cell-flash' : ''}`}>
      {content}
    </div>
  );
}
