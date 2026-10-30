import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get changed files from git diff against HEAD, plus untracked or staged files
function getChangedFiles(): string[] {
  try {
    const diffFiles = execSync('git diff --name-only HEAD', { encoding: 'utf8' })
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const untrackedFiles = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' })
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    return Array.from(new Set([...diffFiles, ...untrackedFiles]))
      .filter(f => f.startsWith('src/') && (f.endsWith('.tsx') || f.endsWith('.jsx') || f.endsWith('.ts')));
  } catch {
    return [];
  }
}

const BANNED_PATTERNS = [
  {
    regex: /\b(?:shadow-lg|shadow-xl|shadow-2xl)\b/,
    message: 'Decorative shadow at rest. Only overlays (dialog, dropdown, popover) may use shadows.',
    ignoreFile: (p: string) => p.includes('components/ui/dialog') || p.includes('components/ui/popover') || p.includes('components/ui/dropdown')
  },
  {
    regex: /\b(?:min-)?h-screen\b/,
    message: 'Use 100dvh or 100svh instead of 100vh/h-screen to prevent mobile browser jumps.'
  },
  {
    regex: /\b(?:group-)?hover:\s*["']/,
    message: 'Dangling hover prefix without target utility class.'
  },
  {
    regex: /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u,
    message: 'Raw emoji in UI markup. Use Lucide SVG icons instead.',
    ignoreFile: (p: string) => p.includes('test') || p.includes('.json')
  }
];

let errorsCount = 0;
const changedFiles = getChangedFiles();

console.log(`🔍 Running Frontend Design Taste Guardrail on ${changedFiles.length} changed file(s)...`);

for (const relPath of changedFiles) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (line.includes('taste-skill-ignore') || line.includes('// eslint-disable')) return;

    for (const rule of BANNED_PATTERNS) {
      if (rule.ignoreFile && rule.ignoreFile(relPath)) continue;
      if (rule.regex.test(line)) {
        console.error(
          `❌ [Design Taste Check] ${relPath}:${idx + 1} - ${rule.message}\n   Line: ${line.trim()}`
        );
        errorsCount++;
      }
    }
  });
}

if (errorsCount > 0) {
  console.error(`\n❌ Failed with ${errorsCount} design taste violation(s) in modified files.`);
  process.exit(1);
} else {
  console.log('✅ [Design Taste Guardrail] Modified files clean! No slop shadows, raw emojis, dangling hover prefixes, or h-screen.');
  process.exit(0);
}
