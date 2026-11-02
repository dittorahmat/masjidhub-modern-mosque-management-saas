import fs from 'fs';
import path from 'path';

// Target critical mobile surfaces: layout components, newly added mobile modules, and interactive feature surfaces
const SCAN_DIRS = [
  path.resolve(process.cwd(), 'src/components/layout'),
  path.resolve(process.cwd(), 'src/components/public'),
  path.resolve(process.cwd(), 'src/components/finance'),
  path.resolve(process.cwd(), 'src/components/zis'),
  path.resolve(process.cwd(), 'src/components/operations'),
  path.resolve(process.cwd(), 'src/pages/dashboard/FinancePage.tsx'),
];

const BANNED_PATTERNS = [
  /\bh-[89]\b/,
  /\bw-[89]\b/,
  /\bsize-[89]\b/,
  /\bmin-h-\[(?:3[0-9]|4[0-3])px\]/, // Bans min-h-[30px] to min-h-[43px]
  /\bmin-w-\[(?:3[0-9]|4[0-3])px\]/,
];

const INTERACTIVE_TARGETS = [
  '<Button',
  'role="button"',
  '<DropdownMenuItem',
  '<SelectItem',
  '<TabsTrigger',
];

const ALLOWED_OVERRIDE = /min-h-\[44px\]/;

let errorsCount = 0;

function scanPath(targetPath: string) {
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      scanPath(path.join(targetPath, entry.name));
    }
  } else if (stat.isFile() && (targetPath.endsWith('.tsx') || targetPath.endsWith('.jsx'))) {
    checkFile(targetPath);
  }
}

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // 1. Check Date Timezone Safety: ban .toISOString().split('T')[0]
    if (line.includes('.toISOString().split') && line.includes("'T'")) {
      console.error(
        `❌ [Date Safety Guardrail] ${path.relative(process.cwd(), filePath)}:${index + 1}` +
        ` uses .toISOString().split('T')[0] which causes day-shift bugs in Indonesian timezones (WIB). Use format(date, 'yyyy-MM-dd') instead.`
      );
      errorsCount++;
    }

    // 2. Check Interactive Touch Targets (Buttons, DropdownMenuItem, SelectItem, etc.)
    const isInteractive = INTERACTIVE_TARGETS.some(target => line.includes(target));
    if (isInteractive) {
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(line) && !ALLOWED_OVERRIDE.test(line)) {
          if (line.includes('size="touch"') || line.includes('size="icon-touch"')) {
            continue;
          }
          console.error(
            `❌ [Touch Target Check] ${path.relative(process.cwd(), filePath)}:${index + 1}` +
            ` uses sub-44px touch class (${line.trim()}). Ensure min-h-[44px] min-w-[44px] or use size="touch"/"icon-touch".`
          );
          errorsCount++;
        }
      }
    }
  });
}

console.log('🔍 Running Mobile Touch Target & Date Ergonomics Guardrail...');
SCAN_DIRS.forEach(scanPath);

if (errorsCount > 0) {
  console.error(`\n⚠️  Found ${errorsCount} accessibility or ergonomics violation(s) in mobile modules.`);
  process.exit(1);
} else {
  console.log('✅ [Touch Target Guardrail] All mobile components satisfy 44px ergonomics and timezone-safe date conventions.');
}
