import React, { useState, useEffect } from 'react';
import { CellText } from './Cells/CellText';
import { CellBoolean } from './Cells/CellBoolean';
import { CellDate } from './Cells/CellDate';
import { CellSelect } from './Cells/CellSelect';
import { CellNumber } from './Cells/CellNumber';
import { CellRating } from './Cells/CellRating';
import { CellReadOnly } from './Cells/CellReadOnly';

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
  switch (columnType) {
    case 'boolean':
      return <CellBoolean {...sharedProps} />;
    case 'date':
      return <CellDate {...sharedProps} />;
    case 'single_select':
    case 'multiple_select':
      return <CellSelect {...sharedProps} />;
    case 'number':
    case 'duration':
      return <CellNumber {...sharedProps} />;
    case 'rating':
      return <CellRating {...sharedProps} />;
    case 'single_line_text':
    case 'email':
    case 'url':
    case 'phone_number':
    case 'long_text':
      return <CellText {...sharedProps} />;
    case 'created_on':
    case 'file':
    default:
      return <CellReadOnly {...sharedProps} />;
  }
}
