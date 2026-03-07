#!/usr/bin/env node

const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const args = new Set(process.argv.slice(2));
const stagedOnly = args.has('--staged');

const SOURCE_CMD = stagedOnly
  ? 'git diff --cached --name-only --diff-filter=ACMRTUXB'
  : 'git ls-files';

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.svg', '.pdf', '.zip', '.gz', '.tgz', '.mp4', '.mov', '.webm', '.woff', '.woff2', '.ttf', '.otf'
]);

const ALWAYS_IGNORE = new Set(['pnpm-lock.yaml']);

const PATTERNS = [
  { name: 'Google API key', regex: /AIza[0-9A-Za-z_\-]{20,}/g },
  { name: 'Stripe live secret key', regex: /\bsk_live_[0-9A-Za-z]{16,}\b/g },
  { name: 'Stripe live publishable key', regex: /\bpk_live_[0-9A-Za-z]{16,}\b/g },
  { name: 'AWS access key id', regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: 'GitHub token', regex: /\b(?:ghp_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{20,})\b/g },
  { name: 'Slack token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: 'Private key block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  {
    name: 'Suspicious secret query param',
    regex: /https?:\/\/[^\s"')]+[?&](?:api[_-]?key|token|secret|access_token|refresh_token|signature|sig)=[^&\s"')]+/gi,
  },
  {
    name: 'Hardcoded env secret assignment',
    regex: /^(?:GEMINI_API_KEY|GOOGLE_API_KEY|GOOGLE_GENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|RUNWAY_API_KEY|LUMA_API_KEY|VEO_API_KEY|NEXTAUTH_SECRET|SENTRY_AUTH_TOKEN)[ \t]*=[ \t]*(?!$|""|''|your-|placeholder|example|changeme)[^\s#]+/gim,
  },
];

function listFiles() {
  const output = execSync(SOURCE_CMD, { encoding: 'utf8' });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => !ALWAYS_IGNORE.has(file))
    .filter((file) => {
      const dot = file.lastIndexOf('.');
      if (dot < 0) return true;
      return !IGNORED_EXTENSIONS.has(file.slice(dot).toLowerCase());
    });
}

function isTextFile(path, content) {
  if (content.includes('\u0000')) {
    return false;
  }
  return !path.endsWith('.svg');
}

function lineNumberFromIndex(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content.charCodeAt(i) === 10) {
      line += 1;
    }
  }
  return line;
}

function maskMatch(value) {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= 12) return '[REDACTED]';
  return `${compact.slice(0, 4)}...${compact.slice(-4)}`;
}

function scanFile(path) {
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    return [];
  }

  if (!isTextFile(path, content)) {
    return [];
  }

  const findings = [];
  for (const pattern of PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match = pattern.regex.exec(content);
    while (match) {
      findings.push({
        file: path,
        line: lineNumberFromIndex(content, match.index),
        type: pattern.name,
        value: maskMatch(match[0]),
      });
      match = pattern.regex.exec(content);
    }
  }

  return findings;
}

function main() {
  const files = listFiles();
  const findings = files.flatMap((file) => scanFile(file));

  if (findings.length === 0) {
    console.log('Secret scan passed: no high-risk patterns found.');
    return;
  }

  console.error('Secret scan failed. Potential sensitive values detected:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.type}] ${finding.value}`);
  }

  console.error('\nFix or redact these values before committing/sharing.');
  process.exit(1);
}

main();
