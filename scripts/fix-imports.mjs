import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');

/**
 * Recursively find all .js files in a directory
 */
function findJsFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and public directories
      if (file !== 'node_modules' && file !== 'public') {
        findJsFiles(filePath, fileList);
      }
    } else if (extname(file) === '.js') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Add .js extensions to relative imports in compiled JavaScript files
 */
function fixImports(filePath) {
  let content = readFileSync(filePath, 'utf-8');

  // Match relative imports (./ or ../) that don't already have an extension
  // This regex matches: import ... from './path' or import ... from '../path'
  const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;

  let modified = false;
  content = content.replace(importRegex, (match, importPath) => {
    // Skip if already has an extension
    if (importPath.match(/\.(js|json|node)$/)) {
      return match;
    }

    // Skip if it's a directory import (ends with /)
    if (importPath.endsWith('/')) {
      return match;
    }

    modified = true;
    return match.replace(importPath, `${importPath}.js`);
  });

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed imports in: ${relative(process.cwd(), filePath)}`);
  }

  return modified;
}

// Find all .js files in dist directory
const files = findJsFiles(distDir);

let totalFixed = 0;
for (const file of files) {
  if (fixImports(file)) {
    totalFixed++;
  }
}

console.log(`\nFixed imports in ${totalFixed} file(s)`);
