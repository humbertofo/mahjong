const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Node' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

function parseLayout(content) {
  const lines = content.split(/\r?\n/);
  let name = '';
  let level = -1;
  let y = 0;
  const slots = [];
  
  for (const line of lines) {
    if (line.startsWith('# name:')) {
      name = line.replace('# name:', '').trim();
    } else if (line.startsWith('# Level')) {
      level++;
      y = 0;
    } else if (level >= 0 && !line.startsWith('#') && line.length > 0) {
      for (let x = 0; x < line.length; x++) {
        if (line[x] === '1') {
          slots.push({ x, y, z: level });
        }
      }
      y++;
    }
  }
  return { name, count: slots.length, slots };
}

async function main() {
  console.log('Fetching repo tree...');
  const treeData = JSON.parse(await fetch('https://api.github.com/repos/ffalt/mahseum/git/trees/main?recursive=1'));
  const targetDirs = ['gnome-mahjongg', 'kmahjongg', 'ogs-mahjong', 'pysolfc', 'step5', 'solitile', 'green-mahjong', 'xmahjongg'];
  
  const layoutFiles = treeData.tree.filter(f => {
    if (!f.path.endsWith('.layout')) return false;
    const parts = f.path.split('/');
    return targetDirs.includes(parts[2]);
  });
  
  console.log(`Found ${layoutFiles.length} candidate layout files in target dirs.`);
  
  // We can fetch them in batches of 15
  const results = [];
  const batchSize = 15;
  for (let i = 0; i < layoutFiles.length; i += batchSize) {
    const batch = layoutFiles.slice(i, i + batchSize);
    await Promise.all(batch.map(async f => {
      try {
        const raw = await fetch(`https://raw.githubusercontent.com/ffalt/mahseum/main/${f.path}`);
        const parsed = parseLayout(raw);
        if (parsed.count > 0 && parsed.count % 2 === 0) {
          const parts = f.path.split('/');
          results.push({
            path: f.path,
            dir: parts[2],
            file: parts[parts.length - 1],
            name: parsed.name || parts[parts.length - 1].replace('.layout', ''),
            count: parsed.count,
            maxZ: Math.max(...parsed.slots.map(s => s.z))
          });
        }
      } catch (err) {
        // ignore fetch error
      }
    }));
    process.stdout.write(`Processed ${Math.min(i + batchSize, layoutFiles.length)}/${layoutFiles.length}...\r`);
  }
  
  console.log('\nProcessing complete. Total valid even layouts:', results.length);
  results.sort((a, b) => a.count - b.count);
  fs.writeFileSync('scripts/available_layouts.json', JSON.stringify(results, null, 2));
  console.log('Saved to scripts/available_layouts.json');
}

main().catch(console.error);
