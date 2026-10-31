import fs from 'node:fs';
import path from 'node:path';

/**
 * Guardrail check to ensure domain option arrays, categories, and enum lists
 * are not duplicated inside component files (src/components/), but centralized in shared/types.ts.
 */

const COMPONENTS_DIR = path.resolve(process.cwd(), 'src/components');
const SHARED_TYPES_PATH = path.resolve(process.cwd(), 'shared/types.ts');

const FORBIDDEN_PATTERNS = [
  /export\s+const\s+[A-Z_]+_CATEGORIES\s*=\s*\[/g,
  /const\s+[A-Z_]+_CATEGORIES\s*=\s*\[/g,
  /export\s+const\s+ASNAF_CATEGORIES\s*=\s*\[/g,
  /export\s+const\s+PAYMENT_METHODS\s*=\s*\[/g,
];

function checkDirectory(dir: string): string[] {
  let errors: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      errors = errors.concat(checkDirectory(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          // Allow re-exports like `export { KAJIAN_CATEGORIES } from '@shared/types'`
          if (content.includes("from '@shared/types'") || content.includes('from "@shared/types"')) {
            continue;
          }
          errors.push(
            `Contract Duplication in ${path.relative(process.cwd(), fullPath)}: Domain category/option list defined locally. Centralize in shared/types.ts instead.`
          );
        }
      }
    }
  }

  return errors;
}

console.log('🔍 Running Contract Centralization Guardrail...');
const violations = checkDirectory(COMPONENTS_DIR);

if (violations.length > 0) {
  console.error('❌ [Contract Guardrail Violation]:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
} else {
  console.log('✅ [Contract Guardrail] Domain categories & contract types properly centralized.');
}
