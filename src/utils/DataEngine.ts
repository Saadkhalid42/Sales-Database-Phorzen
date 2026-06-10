import { parse, isValid, format } from 'date-fns';

export type DateFormatContext = 'MDY' | 'DMY' | 'YMD' | 'AMBIGUOUS' | string;

export function parseNumber(raw: any): number | null {
  if (typeof raw === 'number') return raw;
  if (!raw || typeof raw !== 'string') return null;

  const s = raw.trim();
  // Strip currencies and thousands separators, but keep minus, dot, and parens
  const cleaned = s.replace(/[^\d.\-()]/g, '');
  
  let isNegative = false;
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    isNegative = true;
  }
  
  let valStr = cleaned.replace(/[()]/g, '');
  
  // Handle European decimals (e.g. 1.234,56 -> 1234.56). This is a simple heuristic.
  // If there are multiple dots and one comma, or one comma at the end:
  if (s.includes(',') && !s.includes('.')) {
      valStr = valStr.replace(',', '.');
  }

  const parsed = parseFloat(valStr);
  if (isNaN(parsed)) return null;
  return isNegative ? -parsed : parsed;
}

export const parsePhone = (rawString: any) => {
  if (!rawString) return null;
  // Strip all non-numeric characters (removes +, -, spaces, parentheses)
  let cleaned = String(rawString).replace(/\D/g, '');
  // If it has a US country code (length 11 and starts with 1), strip the 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    cleaned = cleaned.slice(1);
  }
  // Return the 10-digit string
  return cleaned;
};

export function parseBoolean(raw: any): boolean | null {
  if (typeof raw === 'boolean') return raw;
  if (raw === null || raw === undefined) return null;
  
  const t = String(raw).toLowerCase().trim();
  const truthy = ['true', 'yes', 'y', '1', 'x', 'checked', '✓', 't', 'on'];
  const falsy = ['false', 'no', 'n', '0', '', 'unchecked', 'f', 'off'];
  
  if (truthy.includes(t)) return true;
  if (falsy.includes(t)) return false;
  
  return null; // unparseable, should be flagged
}

export function analyzeDateColumn(rawValues: any[]): DateFormatContext {
  const validDates = rawValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  
  for (const raw of validDates) {
     const s = String(raw).trim();
     
     // Quick check for unambiguous month names
     if (/[a-zA-Z]/.test(s)) {
        // If it has letters, Date.parse usually gets it right. We don't need strict ordering if it's "Jan 5".
        continue;
     }

     const parts = s.split(/[\/\-\.\sT]+/);
     const numParts = parts.map(p => parseInt(p, 10)).filter(n => !isNaN(n));
     
     if (numParts.length >= 3) {
         const p1 = numParts[0];
         const p2 = numParts[1];
         const p3 = numParts[2];
         
         // If year is last
         if (p3 > 31) {
            if (p1 > 12 && p1 <= 31) return 'DMY'; // deciding row!
            if (p2 > 12 && p2 <= 31) return 'MDY'; // deciding row!
         }
         // If year is first
         if (p1 > 31) {
             return 'YMD'; 
         }
     }
  }
  return 'AMBIGUOUS'; // Fallback to user locale or prompt
}

export function parseDate(raw: any, context: DateFormatContext = 'MDY'): string | null {
  if (!raw) return null;
  const s = String(raw).trim();

  // If a custom specific mask is provided, try parsing with date-fns first!
  if (context !== 'MDY' && context !== 'DMY' && context !== 'YMD' && context !== 'AMBIGUOUS') {
     const parsedDate = parse(s, context, new Date());
     if (isValid(parsedDate)) {
         return parsedDate.toISOString();
     }
  }
  
  // If it has words, rely on JS native
  if (/[a-zA-Z]/.test(s)) {
     const d = new Date(s);
     return !isNaN(d.getTime()) ? d.toISOString() : null;
  }

  const parts = s.split(/[\/\-\.\sT]+/);
  if (parts.length < 3) {
      const d = new Date(s);
      return !isNaN(d.getTime()) ? d.toISOString() : null;
  }

  let year = 0, month = 0, day = 0;
  const p1 = parseInt(parts[0], 10);
  const p2 = parseInt(parts[1], 10);
  const p3 = parseInt(parts[2], 10);

  if (isNaN(p1) || isNaN(p2) || isNaN(p3)) return null;

  // Handle 2 digit years
  const fixYear = (y: number) => {
      if (y >= 100) return y;
      return y < 70 ? 2000 + y : 1900 + y;
  };

  if (p1 > 31 || context === 'YMD') {
      year = fixYear(p1);
      month = p2 - 1;
      day = p3;
  } else if (context === 'DMY') {
      day = p1;
      month = p2 - 1;
      year = fixYear(p3);
  } else { // MDY or AMBIGUOUS (assume MDY)
      month = p1 - 1;
      day = p2;
      year = fixYear(p3);
  }

  const d = new Date(year, month, day);
  return !isNaN(d.getTime()) ? d.toISOString() : null;
}

export function extractSelectOptions(allRawValues: any[]): { id: string, label: string, color: string }[] {
    const valid = allRawValues.filter(val => val !== null && val !== undefined && val !== '');
    const uniqueStrings = Array.from(new Set(valid.flat().map(String)));
    
    return uniqueStrings.map((val, index) => ({
      id: `opt_${Date.now()}_${index}`,
      label: val,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }));
}

export function convertValue(raw: any, targetType: string, dateContext: DateFormatContext = 'MDY'): { value: any, isFlagged: boolean } {
  if (raw === null || raw === undefined || raw === '') {
      return { value: null, isFlagged: false };
  }

  switch (targetType) {
      case 'single_line_text':
      case 'long_text': {
          if (Array.isArray(raw)) return { value: raw.join(', '), isFlagged: false };
          const strVal = String(raw);
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/.test(strVal)) {
              const d = new Date(strVal);
              if (isValid(d)) {
                  try {
                      // Avoid top level import cycle if not already imported, though we can import format directly.
                      // Since we use date-fns locally, we should add format to the imports at the top
                      return { value: format(d, 'MMM d, yyyy'), isFlagged: false };
                  } catch(e) {}
              }
          }
          return { value: strVal, isFlagged: false };
      }
          
      case 'number': {
          const num = parseNumber(raw);
          return { value: num, isFlagged: num === null };
      }
          
      case 'boolean': {
          const bool = parseBoolean(raw);
          return { value: bool, isFlagged: bool === null };
      }
          
      case 'date':
      case 'created_on':
      case 'last_modified': {
          const dateStr = parseDate(raw, dateContext);
          return { value: dateStr, isFlagged: dateStr === null };
      }
          
      case 'single_select': {
          if (Array.isArray(raw)) return { value: raw.length > 0 ? String(raw[0]) : null, isFlagged: raw.length > 1 };
          return { value: String(raw), isFlagged: false };
      }
          
      case 'multiple_select': {
          if (!Array.isArray(raw)) {
              const items = String(raw).split(/[,;]/).map(s => s.trim()).filter(Boolean);
              return { value: items, isFlagged: false };
          }
          return { value: raw, isFlagged: false };
      }
          
      case 'phone_number': {
          const phone = parsePhone(raw);
          return { value: phone, isFlagged: phone === null || phone.length !== 10 };
      }
          
      case 'append_only_log': {
          if (Array.isArray(raw)) return { value: raw, isFlagged: false };
          if (raw === null || raw === undefined || raw === '') return { value: [], isFlagged: false };
          return { value: [raw], isFlagged: false };
      }

      default:
          return { value: raw, isFlagged: false }; // fallback for unsupported conversions
  }
}

export function formatCellValueForDisplay(value: any, colType: string, colOptions?: any): string {
    if (value === null || value === undefined || value === '') return '';
    
    if (colType === 'date' || colType === 'created_on' || colType === 'last_modified') {
        try {
            const d = typeof value === 'string' ? new Date(value) : value;
            if (isValid(d)) {
                let fmt = colOptions?.dateFormat?.replace('YYYY', 'yyyy').replace('DD', 'dd');
                if (!fmt) {
                    fmt = (colOptions?.showTime) ? 'MMM d, yyyy h:mm a' : 'MMM d, yyyy';
                }
                return format(d, fmt);
            }
        } catch (e) {}
    }
    
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    
    return String(value);
}
