import fs from 'fs';
import path from 'path';

// Target critical mobile surfaces: layout components, mobile views, and newly added mobile modules
const MOBILE_DIRS = [
  path.resolve(process.cwd(), 'src/components/layout'),
  path.resolve(process.cwd(), 'src/components/public'),
  path.resolve(process.cwd(), 'src/components/finance'),
  path.resolve(process.cwd(), 'src/components/zis'),
  path.resolve(process.cwd(), 'src/components/operations'),
];

const BANNED_PATTERNS = [
  /\bh-[89]\b/,
  /\bw-[89]\b/,
  /\bsize-[89]\b/,
];

const ALLOWED_OVERRIDE = /min-h-\[44px\]/;

let errorsCount = 0;

function scanDirectory(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (line.includes('<Button') || line.includes('role="button"')) {
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(line) && !ALLOWED_OVERRIDE.test(line)) {
          if (line.includes('size="touch"') || line.includes('size="icon-touch"')) {
            continue;
          }
          console.error(
            `❌ [Touch Target Check] ${path.relative(process.cwd(), filePath)}:${index + 1}` +
            ` uses small touch class (${line.trim()}). Ensure min-h-[44px] min-w-[44px] or use size="touch"/"icon-touch".`
          );
          errorsCount++;
        }
      }
    }
  });
}

console.log('🔍 Running Mobile Touch Target Guardrail on mobile & layout components...');
MOBILE_DIRS.forEach(scanDirectory);

if (errorsCount > 0) {
  console.error(`\n⚠️  Found ${errorsCount} touch target accessibility violation(s) in mobile modules.`);
  process.exit(1);
} else {
  console.log('✅ [Touch Target Guardrail] All mobile components satisfy minimum 44px touch ergonomics.');
}
