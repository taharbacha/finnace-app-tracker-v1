const fs = require('fs');
let lines = fs.readFileSync('pages/CommandesGros.tsx', 'utf8').split('\n');
// Let's find `    )}` and remove it. It should just be `)}`
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i] === '    )}') {
        lines.splice(i, 1);
        break;
    }
}
// wait, if I used `? (` and `) : (`, the end of the ternary is `)`. So `)}` is correct because it's inside `{ ... }`.
// `{activeTab === 'ads' ? ( <AdsModule /> ) : ( <> ... </> )}`
fs.writeFileSync('pages/CommandesGros.tsx', lines.join('\n'));
