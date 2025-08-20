const fs = require('fs');

// Read the file
let content = fs.readFileSync('/Users/chiranthan/Projects/Hyrlqi/backend/src/routes/games.ts', 'utf8');

// Fix JSON type casting issues
content = content.replace(
  /gameRecord\.gameData\.isCompleted/g, 
  '(gameRecord.gameData as MinesGameData).isCompleted'
);

content = content.replace(
  /gameRecord\.gameData\.gridSize/g, 
  '(gameRecord.gameData as MinesGameData).gridSize'
);

content = content.replace(
  /gameRecord\.gameData\.mineCount/g, 
  '(gameRecord.gameData as MinesGameData).mineCount'
);

content = content.replace(
  /gameRecord\.gameData\.revealedCells/g, 
  '(gameRecord.gameData as MinesGameData).revealedCells'
);

// Fix spread operator issues
content = content.replace(
  /\.\.\.(gameRecord\.gameData),/g, 
  '...(gameRecord.gameData as MinesGameData),'
);

// Write the file back
fs.writeFileSync('/Users/chiranthan/Projects/Hyrlqi/backend/src/routes/games.ts', content);
console.log('Fixed games.ts type issues');

