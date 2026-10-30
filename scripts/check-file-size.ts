import fs from 'node:fs';
import path from 'node:path';

// Threshold for newly introduced/edited modules
const MAX_LINES = 500;
const DIRS_TO_CHECK = ['src/pages/dashboard', 'worker/routes/content'];
// Legacy monolithic files slated for refactor
const EXCLUDED_FILES = ['user-routes.ts'];

let hasError = false;

function checkDirectory(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      checkDirectory(fullPath);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      if (EXCLUDED_FILES.includes(entry.name)) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      if (lines > MAX_LINES) {
        console.error(`❌ [File-Size Cap] ${fullPath} has ${lines} lines (Max: ${MAX_LINES} LOC). Please decompose into sub-components/modules.`);
        hasError = true;
      }
    }
  }
}

for (const dir of DIRS_TO_CHECK) {
  checkDirectory(dir);
}

if (hasError) {
  process.exit(1);
} else {
  console.log(`✅ [File-Size Cap] All checked feature pages and sub-routes are strictly under ${MAX_LINES} LOC.`);
}
