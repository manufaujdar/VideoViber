const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');
const tsBuildInfo = path.join(process.cwd(), 'tsconfig.tsbuildinfo');

try {
  fs.rmSync(nextDir, { recursive: true, force: true });
  fs.rmSync(tsBuildInfo, { force: true });
} catch (error) {
  // Build should continue even if cache cleanup fails.
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[build-cleanup] Skipped some cleanup steps: ${message}`);
}
