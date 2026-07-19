const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');
let fragmentOpen = (code.match(/<>/g) || []).length;
let fragmentClose = (code.match(/<\/>/g) || []).length;
console.log('fragmentOpen', fragmentOpen, 'fragmentClose', fragmentClose);
