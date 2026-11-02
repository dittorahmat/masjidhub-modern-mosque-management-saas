import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Guardrail check to enforce standardized epoch milliseconds (Date.now())
 * on newly introduced or modified files under git comparison against base.
 * Prevents "Jan 1, 1970" bugs from unix seconds (Math.floor(Date.now() / 1000)).
 */

const BANNED_UNIX_SECONDS_PATTERN = /Math\.floor\(\s*Date\.now\(\)\s*\/\s*1000\s*\)/g;

// Whitelist legacy seed, mappers, and the linter itself
const WHITELIST = new Set([
  'scripts/check-timestamps.ts',
  'worker/crypto-utils.ts',
  'worker/db/seed.ts',
  'worker/routes/common.ts',
]);

function getModifiedFiles(): string[] {
  try {
    const diffOutput = execSync('git diff --name-only main...HEAD', { encoding: 'utf8' });
    return diffOutput
      .split('\n')
      .map(s => s.trim().replace(/\\/g, '/'))
      .filter(s => s.length > 0 && (s.endsWith('.ts') || s.endsWith('.tsx')));
  } catch {
    // If git diff against main fails (e.g. detached head or no upstream), fallback to staged/unstaged
    const statusOutput = execSync('git status -s', { encoding: 'utf8' });
    return statusOutput
      .split('\n')
      .map(line => line.slice(3).trim().replace(/\\/g, '/'))
      .filter(s => s.length > 0 && (s.endsWith('.ts') || s.endsWith('.tsx')));
  }
}

console.log('🔍 Running Timestamp Standard Guardrail on modified files...');
const filesToCheck = getModifiedFiles();
let violations: string[] = [];

for (const file of filesToCheck) {
  if (WHITELIST.has(file)) continue;
  if (!fs.existsSync(file)) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (BANNED_UNIX_SECONDS_PATTERN.test(line)) {
      violations.push(
        `${file}:${idx + 1} - Found banned unix seconds \`Math.floor(Date.now() / 1000)\`. Standardize to epoch milliseconds (\`Date.now()\`) per AGENTS.md § 2.`
      );
    }
  });
}

if (violations.length > 0) {
  console.error('❌ [Timestamp Guardrail Violations]:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
} else {
  console.log(`✅ [Timestamp Guardrail] All ${filesToCheck.length} modified file(s) adhere to epoch milliseconds.`);
}
