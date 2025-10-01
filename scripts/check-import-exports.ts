import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

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
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
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

function normalizeExportName(name: string): string {
  const [exportName] = name.split(/\s+as\s+/i);
  return exportName?.trim() || name.trim();
}

function shouldSkipResolvedPath(resolvedPath: string): boolean {
  const normalized = resolvedPath.split(path.sep).join('/');
  if (normalized.includes('/types/')) return true;
  if (normalized.endsWith('/types')) return true;
  return false;
}

async function dynamicImport(resolvedPath: string) {
  const candidates: string[] = [];
  const extensions = ['', '.tsx', '.ts', '.js'];
  for (const ext of extensions) {
    const candidate = resolvedPath.endsWith(ext) ? resolvedPath : resolvedPath + ext;
    candidates.push(candidate);
  }
  for (const ext of extensions) {
    const candidate = path.join(resolvedPath, 'index' + ext);
    candidates.push(candidate);
  }

  for (const candidate of candidates) {
    try {
      return await import(pathToFileURL(candidate).href);
    } catch (err: any) {
      if (err.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find module/.test(String(err)) || /ERR_UNSUPPORTED_DIR_IMPORT/.test(String(err))) {
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Module not found for ${resolvedPath}`);
}

async function main() {
  const filesSets = await Promise.all(directoriesToScan.map(dir => listTsxFiles(dir)));
  const files = filesSets.flat();
  const moduleCache = new Map<string, Promise<any>>();

  const problems: { file: string; importPath: string; exportName: string }[] = [];

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
      if (shouldSkipResolvedPath(resolved)) continue;

      const names = namesRaw.split(',').map(part => normalizeExportName(part)).filter(Boolean);

      if (!moduleCache.has(resolved)) {
        moduleCache.set(resolved, dynamicImport(resolved));
      }

      let mod: any;
      try {
        mod = await moduleCache.get(resolved);
      } catch (err) {
        problems.push({ file, importPath, exportName: '(module load failed)' });
        continue;
      }

      for (const name of names) {
        if (!(name in mod)) {
          problems.push({ file, importPath, exportName: name });
        }
      }
    }
  }

  if (problems.length === 0) {
    console.log('No missing exports found.');
  } else {
    console.log('Missing exports:');
    for (const problem of problems) {
      console.log(`${path.relative(projectRoot, problem.file)} imports { ${problem.exportName} } from ${problem.importPath}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
