const fs = require('fs');
let code = fs.readFileSync('pages/CommandesGros.tsx', 'utf8');
let divOpen = (code.match(/<div/g) || []).length;
let divClose = (code.match(/<\/div>/g) || []).length;
console.log('divOpen', divOpen, 'divClose', divClose);
