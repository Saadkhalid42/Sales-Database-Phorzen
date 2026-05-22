import fs from 'fs';
const file = 'src/utils/DataEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// Add parsePhone
const parsePhone = `export const parsePhone = (rawString: any) => {
  if (!rawString) return null;
  // Strip all non-numeric characters (removes +, -, spaces, parentheses)
  let cleaned = String(rawString).replace(/\\D/g, '');
  // If it has a US country code (length 11 and starts with 1), strip the 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    cleaned = cleaned.slice(1);
  }
  // Return the 10-digit string
  return cleaned;
};
`;

code = code.replace(/export function parseBoolean/, parsePhone + '\nexport function parseBoolean');

// Add phone_number to convertValue
code = code.replace(
/      default:\n          return { value: raw, isFlagged: false };/,
`      case 'phone_number': {
          const phone = parsePhone(raw);
          return { value: phone, isFlagged: phone === null || phone.length !== 10 };
      }
          
      default:
          return { value: raw, isFlagged: false };`
);

fs.writeFileSync(file, code);
