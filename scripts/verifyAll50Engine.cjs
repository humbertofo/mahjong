// Test all 50 levels directly with the game logic
const fs = require('fs');

// We can read src/core/layouts/catalog50.ts and parse each layout
const catalogText = fs.readFileSync('src/core/layouts/catalog50.ts', 'utf8');

// Quick extract of the CATALOG_50_LAYOUTS
// We can use a small evaluator or regex
const jsonMatch = catalogText.match(/export const CATALOG_50_LAYOUTS: BoardLayout\[\] = (\[[\s\S]*?\]);\s*$/);
if (!jsonMatch) {
  console.error('Could not match CATALOG_50_LAYOUTS array in catalog50.ts');
  process.exit(1);
}

// Convert typescript-like object syntax to JSON
let rawArr = jsonMatch[1];
// Replace unquoted keys
rawArr = rawArr.replace(/(\s*)(id|name|description|difficulty|slots|x|y|z):/g, '$1"$2":');
// Replace single quotes with double quotes
rawArr = rawArr.replace(/'/g, '"');
// Remove trailing commas before } or ]
rawArr = rawArr.replace(/,(\s*[\]}])/g, '$1');

let layouts;
try {
  layouts = JSON.parse(rawArr);
} catch (e) {
  console.log('JSON parse error, using eval in sandbox:');
  layouts = eval('(' + jsonMatch[1] + ')');
}

console.log(`Loaded ${layouts.length} layouts from catalog50.ts.`);

let errors = 0;
layouts.forEach((layout, idx) => {
  const num = idx + 1;
  const count = layout.slots.length;
  
  if (count === 0) {
    console.error(`[Level ${num}] ERROR: 0 slots!`);
    errors++;
    return;
  }
  
  if (count % 2 !== 0) {
    console.error(`[Level ${num}] ERROR: Odd slot count (${count})!`);
    errors++;
  }
  
  // Check for duplicate slots
  const set = new Set();
  for (const s of layout.slots) {
    const key = `${s.x},${s.y},${s.z}`;
    if (set.has(key)) {
      console.error(`[Level ${num}] ERROR: Duplicate slot at ${key}!`);
      errors++;
    }
    set.add(key);
  }
  
  // Check free tiles at start (Mahjong blocking logic:
  // Tile occupies [x, x+2) and [y, y+2).
  // A tile is blocked if:
  // 1. Another tile rests directly on top (z + 1 with overlapping [x-1, x+1] and [y-1, y+1])
  // 2. Both left (x - 2, same z) AND right (x + 2, same z) are blocked.
  let freeTiles = 0;
  for (const s of layout.slots) {
    // Check covered
    const isCovered = layout.slots.some(other => 
      other.z === s.z + 1 &&
      Math.abs(other.x - s.x) < 2 &&
      Math.abs(other.y - s.y) < 2
    );
    if (isCovered) continue;
    
    // Check left blocked
    const isLeftBlocked = layout.slots.some(other =>
      other.z === s.z &&
      (other.x === s.x - 2 || other.x === s.x - 1) &&
      Math.abs(other.y - s.y) < 2
    );
    
    // Check right blocked
    const isRightBlocked = layout.slots.some(other =>
      other.z === s.z &&
      (other.x === s.x + 2 || other.x === s.x + 1) &&
      Math.abs(other.y - s.y) < 2
    );
    
    if (!isLeftBlocked || !isRightBlocked) {
      freeTiles++;
    }
  }
  
  if (freeTiles < 2) {
    console.warn(`[Level ${num}] WARNING: Very few free tiles at start (${freeTiles})!`);
  } else {
    // All good
  }
  
  const minX = Math.min(...layout.slots.map(s => s.x));
  const maxX = Math.max(...layout.slots.map(s => s.x));
  const minY = Math.min(...layout.slots.map(s => s.y));
  const maxY = Math.max(...layout.slots.map(s => s.y));
  const maxZ = Math.max(...layout.slots.map(s => s.z));
  
  console.log(`[Level ${num.toString().padStart(2, ' ')}] ${layout.name.padEnd(28, ' ')} | ${count.toString().padStart(3, ' ')} peças | Z:0..${maxZ} | Dim: ${maxX - minX + 2}x${maxY - minY + 2} | Free at start: ${freeTiles}`);
});

if (errors === 0) {
  console.log('\n🌟 ALL 50 LEVELS VALIDATED PERFECTLY! Zero errors detected.');
} else {
  console.error(`\n❌ Found ${errors} errors in layouts!`);
  process.exit(1);
}
