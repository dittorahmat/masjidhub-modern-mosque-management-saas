import fs from 'node:fs';
import path from 'node:path';

/**
 * Guardrail check to ensure controllers and middlewares under worker/
 * use canonical response helpers (ok, bad, notFound, unauthorized, forbidden)
 * from worker/core-utils.ts rather than constructing ad-hoc raw c.json() calls with status codes.
 */

const WORKER_ROUTES_DIR = path.resolve(process.cwd(), 'worker/routes');
const WORKER_MIDDLEWARE_DIR = path.resolve(process.cwd(), 'worker/middleware');

const RAW_STATUS_PATTERNS = [
  /c\.json\(\s*\{[^}]*\}\s*,\s*401\s*\)/g,
  /c\.json\(\s*\{[^}]*\}\s*,\s*403\s*\)/g,
  /c\.json\(\s*\{[^}]*\}\s*,\s*404\s*\)/g,
];

function checkDirectory(dir: string): string[] {
  let errors: string[] = [];
  if (!fs.existsSync(dir)) return errors;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      errors = errors.concat(checkDirectory(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of RAW_STATUS_PATTERNS) {
        if (pattern.test(content)) {
          errors.push(
            `Non-canonical response helper in ${path.relative(process.cwd(), fullPath)}: Raw c.json(..., 401/403/404) detected. Use unauthorized(c), forbidden(c), or notFound(c) from worker/core-utils.ts.`
          );
        }
      }
    }
  }

  return errors;
}

console.log('🔍 Running Canonical Response Helper Guardrail...');
const violations = [
  ...checkDirectory(WORKER_ROUTES_DIR),
  ...checkDirectory(WORKER_MIDDLEWARE_DIR),
];

if (violations.length > 0) {
  console.error('❌ [Canonical Response Guardrail Violations]:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
} else {
  console.log('✅ [Canonical Response Guardrail] All route handlers and middlewares use canonical core-utils response helpers.');
}
