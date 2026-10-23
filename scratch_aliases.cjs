const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanDir(full);
    } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.includes("from '@/") || line.includes('from "@/')) {
          const match = line.match(/from\s+['"]@\/([^'"]+)['"]/);
          if (match) {
            allAliases.add(match[1].split('/')[0]);
          }
        }
      }
    }
  }
}

const allAliases = new Set();
scanDir('src/solar');
console.log('Aliases usados dentro de src/solar:', Array.from(allAliases));
