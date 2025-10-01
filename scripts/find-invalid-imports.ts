import { promises as fs } from 'fs';
import path from 'path';

const projectRoot = path.resolve('.');
const srcRoot = path.join(projectRoot, 'src');
const directoriesToScan = [path.join(srcRoot, 'app'), path.join(srcRoot, 'components')];

async function listTsxFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTsxFiles(fullPath)));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(fullPath);
    }
  }
  return files;
}

function resolveImport(importPath: string, fromFile: string): string | null {
  if (importPath.startsWith('@/')) {
    const relative = importPath.slice(2);
    return path.join(srcRoot, relative);
  }
  if (importPath.startsWith('.')) {
    return path.resolve(path.dirname(fromFile), importPath);
  }
  return null;
}

async function readExports(filePath: string): Promise<Set<string>> {
  const content = await fs.readFile(filePath, 'utf8');
  const exports = new Set<string>();
  const exportRegexes = [
    /export\s+function\s+(\w+)/g,
    /export\s+const\s+(\w+)/g,
    /export\s+class\s+(\w+)/g,
    /export\s+let\s+(\w+)/g,
    /export\s+var\s+(\w+)/g,
    /export\s*{\s*([^}]+)\s*}/g,
  ];

  for (const regex of exportRegexes) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      if (regex === exportRegexes[5]) {
        const names = match[1]?.split(',').map((part) => part.trim()) || [];
        for (const nameRaw of names) {
          const [name] = nameRaw.split(/\s+as\s+/i);
          if (name) exports.add(name);
        }
      } else {
        const name = match[1];
        if (name) exports.add(name);
      }
    }
  }

  if (/export\s+default\s+function\s+(\w+)/.test(content)) {
    const match = content.match(/export\s+default\s+function\s+(\w+)/);
    const name = match?.[1];
    exports.add('default');
    if (name) exports.add(name);
  } else if (/export\s+default\s+(\w+)/.test(content)) {
    exports.add('default');
  }

  return exports;
}

async function ensureExports(resolvedPath: string): Promise<Set<string>> {
  const candidates: string[] = [];
  const extensions = ['', '.tsx', '.ts', '.js'];
  for (const ext of extensions) {
    const candidate = resolvedPath.endsWith(ext) ? resolvedPath : resolvedPath + ext;
    candidates.push(candidate);
  }
  for (const ext of extensions) {
    candidates.push(path.join(resolvedPath, 'index' + ext));
  }

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        return readExports(candidate);
      }
    } catch (err) {
      continue;
    }
  }

  return new Set();
}

async function main() {
  const files = (await Promise.all(directoriesToScan.map((dir) => listTsxFiles(dir)))).flat();
  const exportCache = new Map<string, Promise<Set<string>>>();
  const problems: { file: string; importPath: string; name: string }[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const importRegex = /import\s*{([^}]+)}\s*from\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const namesRaw = match[1];
      const importPath = match[2];
      if (!importPath || !namesRaw) continue;
      const resolved = resolveImport(importPath, file);
      if (!resolved) continue;
      if (resolved.includes(`${path.sep}types`) || resolved.endsWith('types')) continue;

      if (!exportCache.has(resolved)) {
        exportCache.set(resolved, ensureExports(resolved));
      }
      const exports = await exportCache.get(resolved)!;

      const names = namesRaw.split(',').map(part => part.trim()).filter(Boolean);
      for (const nameRaw of names) {
        const [name] = nameRaw.split(/\s+as\s+/i);
        if (name && !exports.has(name)) {
          problems.push({ file, importPath, name });
        }
      }
    }
  }

  if (problems.length === 0) {
    console.log('No import/export mismatches found.');
  } else {
    console.log('Potential mismatches:');
    for (const problem of problems) {
      console.log(`${path.relative(projectRoot, problem.file)} imports { ${problem.name} } from ${problem.importPath}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
