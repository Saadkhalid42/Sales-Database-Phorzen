import fs from 'fs';

let card = fs.readFileSync('src/components/Grid/RecordCard.tsx', 'utf8');

card = card.replace(/bg-surface/g, 'bg-surface-raised');
card = card.replace(/border-\[rgba\(var\(--border-color\),var\(--grid-border-opacity,0\.5\)\)\]/g, 'border-divider');
card = card.replace(/text-\[rgba\(var\(--text-color\),0\.4\)\]/g, 'text-text-muted');
card = card.replace(/text-\[rgba\(var\(--text-color\),0\.85\)\]/g, 'text-text-primary');
card = card.replace(/bg-\[rgba\(var\(--primary-color\),0\.02\)\]/g, 'bg-accent-subtle');

fs.writeFileSync('src/components/Grid/RecordCard.tsx', card);
