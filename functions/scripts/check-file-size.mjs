import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC_DIR = join(process.cwd(), 'src');
const MAX_LINES_DEFAULT = 1200;
const INDEX_FREEZE_MAX_LINES = 6095;

function walkTsFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkTsFiles(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.ts')) {
      result.push(fullPath);
    }
  }
  return result;
}

function countLines(filePath) {
  const content = readFileSync(filePath, 'utf8');
  if (content.length === 0) return 0;
  return content.split('\n').length;
}

function maxAllowedLines(filePath) {
  const rel = relative(SRC_DIR, filePath).replaceAll('\\', '/');
  if (rel === 'index.ts') {
    return INDEX_FREEZE_MAX_LINES;
  }
  return MAX_LINES_DEFAULT;
}

function main() {
  if (!statSync(SRC_DIR).isDirectory()) {
    throw new Error('src klasoru bulunamadi.');
  }

  const tsFiles = walkTsFiles(SRC_DIR);
  const violations = [];

  for (const filePath of tsFiles) {
    const lines = countLines(filePath);
    const max = maxAllowedLines(filePath);
    if (lines > max) {
      const rel = relative(process.cwd(), filePath).replaceAll('\\', '/');
      violations.push({ rel, lines, max });
    }
  }

  if (violations.length > 0) {
    console.error('Dosya satir limiti ihlali bulundu:');
    for (const violation of violations) {
      console.error(`- ${violation.rel}: ${violation.lines} satir (max ${violation.max})`);
    }
    process.exit(1);
  }

  console.log('Dosya satir limiti kontrolu gecti.');
}

main();
