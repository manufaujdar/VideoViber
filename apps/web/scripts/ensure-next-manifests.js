const fs = require('fs');
const path = require('path');

const serverAppDir = path.join(process.cwd(), '.next', 'server', 'app');
const manifestRelativePath = 'page_client-reference-manifest.js';
const manifestStub = `/* Auto-generated fallback manifest for trace stability. */
globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};
`;

function listNftFiles(rootDir) {
  const stack = [rootDir];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('page.js.nft.json')) {
        files.push(absolutePath);
      }
    }
  }

  return files;
}

function ensureManifestForNftFile(nftFilePath) {
  const nftDir = path.dirname(nftFilePath);

  let parsed;
  try {
    const raw = fs.readFileSync(nftFilePath, 'utf8');
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }

  if (!parsed || !Array.isArray(parsed.files)) {
    return false;
  }

  if (!parsed.files.includes(manifestRelativePath)) {
    return false;
  }

  const manifestPath = path.join(nftDir, manifestRelativePath);
  if (fs.existsSync(manifestPath)) {
    return false;
  }

  fs.writeFileSync(manifestPath, manifestStub, 'utf8');
  return true;
}

if (!fs.existsSync(serverAppDir)) {
  process.exit(0);
}

const nftFiles = listNftFiles(serverAppDir);
let createdCount = 0;

for (const nftFilePath of nftFiles) {
  if (ensureManifestForNftFile(nftFilePath)) {
    createdCount += 1;
  }
}

if (createdCount > 0) {
  console.log(`[manifest-fix] Created ${createdCount} missing client-reference manifest file(s).`);
}
