const fs = require('fs');

// Read the file
let content = fs.readFileSync('/Users/chiranthan/Projects/Hyrlqi/backend/src/routes/games.ts', 'utf8');

// Replace unsafe type assertions with safe ones using 'unknown' intermediate
content = content.replace(
  /\(gameRecord\.gameData as MinesGameData\)/g, 
  '(gameRecord.gameData as unknown as MinesGameData)'
);

// Write the file back
fs.writeFileSync('/Users/chiranthan/Projects/Hyrlqi/backend/src/routes/games.ts', content);
console.log('Fixed unsafe type assertions');

