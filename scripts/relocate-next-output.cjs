const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const sourceAppDir = path.join(repoRoot, 'apps', 'web');
const sourceNextDir = path.join(repoRoot, 'apps', 'web', '.next');
const targetNextDir = path.join(repoRoot, '.next');
const sourceAppNodeModulesDir = path.join(sourceAppDir, 'node_modules');
const repoNodeModulesDir = path.join(repoRoot, 'node_modules');

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function listFiles(dir, predicate, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(fullPath, predicate, out);
      continue;
    }

    if (predicate(fullPath)) {
      out.push(fullPath);
    }
  }

  return out;
}

function remapAbsoluteTargetPath(oldAbsolutePath) {
  if (oldAbsolutePath === sourceNextDir) {
    return targetNextDir;
  }

  const sourcePrefix = sourceNextDir + path.sep;
  if (oldAbsolutePath.startsWith(sourcePrefix)) {
    return path.join(targetNextDir, oldAbsolutePath.slice(sourcePrefix.length));
  }

  // Avoid preserving workspace-scoped node_modules symlink paths in traces.
  // Vercel serverless bundles are more reliable when traces reference root node_modules paths.
  const sourceNodeModulesPrefix = sourceAppNodeModulesDir + path.sep;
  if (oldAbsolutePath.startsWith(sourceNodeModulesPrefix)) {
    if (fs.existsSync(oldAbsolutePath)) {
      try {
        return fs.realpathSync(oldAbsolutePath);
      } catch {
        // Fall back to deterministic remapping below.
      }
    }

    const repoNodeModulesPath = path.join(
      repoNodeModulesDir,
      oldAbsolutePath.slice(sourceNodeModulesPrefix.length)
    );
    if (fs.existsSync(repoNodeModulesPath)) {
      return repoNodeModulesPath;
    }
  }

  return oldAbsolutePath;
}

function mapTracePath(traceFilePath, oldTraceFilePath, relativePath) {
  const oldAbsolute = path.resolve(path.dirname(oldTraceFilePath), relativePath);
  const rewrittenAbsolute = remapAbsoluteTargetPath(oldAbsolute);
  const remapped = path.relative(path.dirname(traceFilePath), rewrittenAbsolute);
  return toPosix(remapped);
}

function rewriteNftTracePaths() {
  const traceFiles = listFiles(targetNextDir, (filePath) => filePath.endsWith('.nft.json'));

  for (const traceFilePath of traceFiles) {
    const relativeTracePath = path.relative(targetNextDir, traceFilePath);
    const oldTraceFilePath = path.join(sourceNextDir, relativeTracePath);
    const trace = JSON.parse(fs.readFileSync(traceFilePath, 'utf8'));

    if (!Array.isArray(trace.files)) {
      continue;
    }

    trace.files = trace.files.map((relativePath) => {
      if (typeof relativePath !== 'string') {
        return relativePath;
      }

      return mapTracePath(traceFilePath, oldTraceFilePath, relativePath);
    });

    fs.writeFileSync(traceFilePath, JSON.stringify(trace));
  }
}

function validateTraceTargets() {
  const traceFiles = listFiles(targetNextDir, (filePath) => filePath.endsWith('.nft.json'));
  const missing = [];

  for (const traceFilePath of traceFiles) {
    const trace = JSON.parse(fs.readFileSync(traceFilePath, 'utf8'));
    if (!Array.isArray(trace.files)) {
      continue;
    }

    for (const relativePath of trace.files) {
      if (typeof relativePath !== 'string') {
        continue;
      }

      const absolutePath = path.resolve(path.dirname(traceFilePath), relativePath);
      if (!fs.existsSync(absolutePath)) {
        missing.push({
          trace: path.relative(repoRoot, traceFilePath),
          file: relativePath,
          resolved: absolutePath,
        });

        if (missing.length >= 25) {
          break;
        }
      }
    }

    if (missing.length >= 25) {
      break;
    }
  }

  if (missing.length > 0) {
    console.error('Relocated Next trace validation failed. Missing traced files:');
    for (const item of missing) {
      console.error(`- ${item.trace} -> ${item.file} (${item.resolved})`);
    }
    process.exit(1);
  }
}

if (!fs.existsSync(sourceNextDir)) {
  console.error(`Source Next output does not exist: ${sourceNextDir}`);
  process.exit(1);
}

fs.rmSync(targetNextDir, { recursive: true, force: true });
fs.cpSync(sourceNextDir, targetNextDir, { recursive: true });

rewriteNftTracePaths();
validateTraceTargets();

console.log('Relocated Next output to root .next with trace paths normalized.');
