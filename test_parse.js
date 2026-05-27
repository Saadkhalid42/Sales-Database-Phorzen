import { parse, isValid } from 'date-fns';

const s1 = "18/04/2026 10:30 PM";
const d1 = parse(s1, "dd/MM/yyyy h:mm a", new Date());

const s2 = "5/27/2026, 8:14:34 AM";
const d2 = parse(s2, "dd/MM/yyyy h:mm a", new Date());
console.log("s1:", isValid(d1), d1);
console.log("s2:", isValid(d2), d2);
