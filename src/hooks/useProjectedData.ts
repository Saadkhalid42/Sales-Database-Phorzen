import { useMemo } from 'react';
import { useStore } from '../store/useStore';

export function useProjectedData() {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const searchQuery = useStore(state => state.searchQuery);

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);

  const records = activeDb?.records || [];
  const activeSorts = currentView?.sorts || [];
  const activeFilters = currentView?.filters || [];
  const isFilterDisabled = currentView?.isFilterDisabled || false;

  const projectedData = useMemo(() => {
    let filtered = [...records];

    // Apply Filters
    if (activeFilters.length > 0 && !isFilterDisabled) {
      filtered = filtered.filter(r => {
        const evaluateSingleFilter = (f: any) => {
          const val = r.cells[f.colKey];
          const isArr = Array.isArray(val);
          const strVal = isArr ? val.join(',').toLowerCase() : String(val || '').toLowerCase();
          const fVal = String(f.value || '').toLowerCase();
          const numVal = Number(val);
          const numFVal = Number(f.value);

          switch (f.operator) {
            case 'contains': return strVal.includes(fVal);
            case 'is exactly': return strVal === fVal;
            case '=': return numVal === numFVal;
            case '>': return numVal > numFVal;
            case '<': return numVal < numFVal;
            case 'is': return isArr ? val.includes(f.value) : val === f.value;
            case 'is not': return isArr ? !val.includes(f.value) : val !== f.value;
            case 'is empty': return val == null || val === '';
            case 'is not empty': return val != null && val !== '';
            case 'is before': return new Date(val) < new Date(f.value);
            case 'is after': return new Date(val) > new Date(f.value);
            default: return true;
          }
        };
        const operator = currentView?.filterJoinOperator || 'and';
        return operator === 'or' 
          ? activeFilters.some(evaluateSingleFilter) 
          : activeFilters.every(evaluateSingleFilter);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        Object.values(r.cells).some(val => String(val || '').toLowerCase().includes(q))
      );
    }

    // Apply Sorts
    if (activeSorts.length > 0) {
      filtered.sort((a, b) => {
        for (const sort of activeSorts) {
          const valA = a.cells[sort.colKey];
          const valB = b.cells[sort.colKey];
          
          if (valA === valB) continue;
          if (valA == null || valA === '') return sort.direction === 'asc' ? 1 : -1;
          if (valB == null || valB === '') return sort.direction === 'asc' ? -1 : 1;
          
          let cmp = 0;
          if (typeof valA === 'number' && typeof valB === 'number') {
            cmp = valA > valB ? 1 : -1;
          } else {
            cmp = String(valA).localeCompare(String(valB));
          }
          
          return sort.direction === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    }

    return filtered;
  }, [records, activeViewId, searchQuery, activeFilters, activeSorts, isFilterDisabled]);

  return projectedData;
}
