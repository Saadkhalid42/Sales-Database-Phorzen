import { useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useProjectedData() {
  const databases = useStore(state => state.databases);
  const activeDatabaseId = useStore(state => state.activeDatabaseId);
  const activeWorkspaceId = useStore(state => state.activeWorkspaceId);
  const activeViewId = useStore(state => state.activeViewId);
  const searchQuery = useStore(state => state.searchQuery);
  const stagedEvictions = useStore(state => state.stagedEvictions);
  const remoteMutations = useStore(state => state.remoteMutations);
  const stageEviction = useStore(state => state.stageEviction);
  const expandedRecordId = useStore(state => state.expandedRecordId);
  
  const clearEviction = useStore(state => state.clearEviction);
  const prevPassingRef = useRef<Set<string>>(new Set());
  const pendingEvictionsRef = useRef<{ id: string, mode: 'locked' | 'countdown' }[]>([]);
  const evictionsToClearRef = useRef<string[]>([]);
  const prevFilterHashRef = useRef('');

  const activeDb = databases.find(db => db.id === activeDatabaseId);
  const activeWs = activeDb?.workspaces.find(ws => ws.id === activeWorkspaceId);
  const currentView = activeWs?.views.find(v => v.id === activeViewId);

  const records = activeDb?.records || [];
  const activeSorts = currentView?.sorts || [];
  const activeFilters = currentView?.filters || [];
  const isFilterDisabled = currentView?.isFilterDisabled || false;

  const projectedData = useMemo(() => {
    let result: any[] = [];
    const currentlyPassing = new Set<string>();
    pendingEvictionsRef.current = [];

    const currentFilterHash = JSON.stringify({ activeViewId, activeFilters, searchQuery, isFilterDisabled });
    if (prevFilterHashRef.current !== currentFilterHash) {
      prevPassingRef.current.clear();
      prevFilterHashRef.current = currentFilterHash;
    }

    // Evaluate each record manually to handle staged evictions
    for (const r of records) {
      let passes = true;
      
      // Check filters
      if (activeFilters.length > 0 && !isFilterDisabled) {
        const evaluateSingleFilter = (f: any) => {
          const val = r.cells[f.colKey];
          
          if (f.operator === 'is empty') return val == null || val === '' || (Array.isArray(val) && val.length === 0);
          if (f.operator === 'is not empty') return val != null && val !== '' && (!Array.isArray(val) || val.length > 0);

          const isArr = Array.isArray(val);
          const strVal = isArr ? val.join(',').toLowerCase() : String(val || '').toLowerCase();
          const fVal = String(f.value || '').toLowerCase();
          const numVal = Number(val);
          const numFVal = Number(f.value);

          const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          switch (f.operator) {
            // Text & Select
            case 'is exactly':
            case 'is': {
              if (typeof val === 'boolean' || f.operator === 'is true' || f.operator === 'is false') {
                 // handled below
              } else if (isArr) {
                return val.includes(f.value);
              }
              return strVal === fVal;
            }
            case 'is not': return isArr ? !val.includes(f.value) : strVal !== fVal;
            case 'contains': return strVal.includes(fVal);
            case 'doesnt contain': return !strVal.includes(fVal);
            case 'contains word': return new RegExp('\\b' + escapeRegExp(fVal) + '\\b', 'i').test(strVal);
            case 'doesnt contain word': return !new RegExp('\\b' + escapeRegExp(fVal) + '\\b', 'i').test(strVal);
            
            // Numbers
            case '=': return numVal === numFVal;
            case '>': return numVal > numFVal;
            case '<': return numVal < numFVal;

            // Arrays / Multiple Select fallback
            case 'is any of': {
              const options = String(f.value || '').split(',').map(v => v.trim().toLowerCase());
              if (isArr) {
                return options.some(opt => val.map((v: string) => String(v).toLowerCase()).includes(opt));
              }
              return options.includes(strVal);
            }
            case 'is none of': {
              const options = String(f.value || '').split(',').map(v => v.trim().toLowerCase());
              if (isArr) {
                return !options.some(opt => val.map((v: string) => String(v).toLowerCase()).includes(opt));
              }
              return !options.includes(strVal);
            }

            // Dates
            case 'is before': return new Date(val) < new Date(f.value);
            case 'is on or before': return new Date(val) <= new Date(f.value);
            case 'is after': return new Date(val) > new Date(f.value);
            case 'is on or after': return new Date(val) >= new Date(f.value);
            case 'is within': {
              const days = parseInt(f.value);
              if (isNaN(days)) return false;
              const diffDays = (new Date().getTime() - new Date(val).getTime()) / (1000 * 3600 * 24);
              return diffDays >= 0 && diffDays <= days;
            }
            case 'day of month is': return new Date(val).getDate() === parseInt(f.value);
            
            // Boolean
            case 'is true': return !!val === true;
            case 'is false': return !!val === false;

            default: return true;
          }
        };
        const operator = currentView?.filterJoinOperator || 'and';
        passes = operator === 'or' 
          ? activeFilters.some(evaluateSingleFilter) 
          : activeFilters.every(evaluateSingleFilter);
      }
      
      // Check search
      if (passes && searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        passes = Object.values(r.cells).some(val => String(val || '').toLowerCase().includes(q));
      }

      if (passes) {
        currentlyPassing.add(r.id);
        result.push(r);
        if (stagedEvictions[r.id]) {
          evictionsToClearRef.current.push(r.id);
        }
      } else {
        // If it failed but it was passing in the PREVIOUS frame, soft evict it
        const wasPassing = prevPassingRef.current.has(r.id);
        
        if (wasPassing) {
          const isRemotelyMutated = Object.keys(remoteMutations).some(key => key.startsWith(r.id + '_'));
          const mode = isRemotelyMutated ? 'countdown' : 'locked';
          pendingEvictionsRef.current.push({ id: r.id, mode });
          result.push({ ...r, _isSoftEvicted: true, _evictionMode: mode });
        } else if (stagedEvictions[r.id]) {
          // If it was already staged for eviction, keep it in the projected data
          result.push({ ...r, _isSoftEvicted: true, _evictionMode: stagedEvictions[r.id].mode });
        }
      }
    }
    
    // Sort logic (only on result)
    if (activeSorts.length > 0) {
      result.sort((a, b) => {
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

    // Update the cache for the next render
    prevPassingRef.current = currentlyPassing;
    return result as any;
  }, [records, activeViewId, searchQuery, activeFilters, activeSorts, isFilterDisabled, stagedEvictions, expandedRecordId, remoteMutations]);

  // Safely trigger state updates for pending evictions outside of the render cycle
  useEffect(() => {
    if (pendingEvictionsRef.current.length > 0) {
      pendingEvictionsRef.current.forEach(ev => {
        if (!stagedEvictions[ev.id]) {
          stageEviction(ev.id, ev.mode);
        }
      });
      pendingEvictionsRef.current = [];
    }
    
    if (evictionsToClearRef.current.length > 0) {
      evictionsToClearRef.current.forEach(id => clearEviction(id));
      evictionsToClearRef.current = [];
    }
  }, [projectedData, stageEviction, stagedEvictions, clearEviction]);

  return projectedData;
}
