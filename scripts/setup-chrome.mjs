#!/usr/bin/env node
/**
 * Downloads Chrome binaries for each entry in chrome-versions.json.
 *
 * Sources:
 *  - Chrome < 113  : Bugazelle historical archive (linux_x64 snapshots)
 *  - Chrome >= 113 : Chrome for Testing public API
 *  - "latest"      : Chrome for Testing last-known-good stable channel
 *
 * Binaries are extracted to .chrome-bins/chrome-{version}/ and a manifest
 * (.chrome-bins/manifest.json) mapping version → executablePath is written.
 *
 * The script is idempotent: already-downloaded versions are skipped.
 */

import {
  chmodSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { dirname, join } from 'path';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';
import unzipper from 'unzipper';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CHROME_BINS_DIR = join(ROOT, '.chrome-bins');
const MANIFEST_PATH = join(CHROME_BINS_DIR, 'manifest.json');
const VERSIONS_PATH = join(ROOT, 'chrome-versions.json');

const BUGAZELLE_URL =
  'https://raw.githubusercontent.com/Bugazelle/chromium-all-old-stable-versions/master/chromium.stable.json';
const CFT_VERSIONS_URL =
  'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json';
const CFT_LATEST_URL =
  'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const buffer = await res.arrayBuffer();
  writeFileSync(destPath, Buffer.from(buffer));
}

async function extractZip(zipPath, destDir) {
  await pipeline(createReadStream(zipPath), unzipper.Extract({ path: destDir }));
}

function findChromeExecutable(dir) {
  const candidates = [
    join(dir, 'chrome-linux64', 'chrome'),
    join(dir, 'chrome-linux', 'chrome'),
    join(dir, 'chrome'),
  ];
  return candidates.find(existsSync) ?? null;
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

function pickBestVersion(entries) {
  // Sort by full dotted version number (ascending), return last (highest)
  return entries.sort(([a], [b]) => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 4; i++) {
      const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

async function resolveBugazelleUrl(major, bugazelleData) {
  const section = bugazelleData.linux64;
  if (!section) throw new Error('No linux64 section in Bugazelle data');

  const candidates = Object.entries(section).filter(
    ([ver, info]) =>
      ver.startsWith(`${major}.`) &&
      typeof info.download_url === 'string' &&
      !info.download_url.startsWith('Error:'),
  );

  if (candidates.length === 0) {
    throw new Error(
      `No valid linux_x64 download for Chrome ${major} in Bugazelle archive`,
    );
  }

  const sorted = pickBestVersion(candidates);
  const [fullVersion, info] = sorted[sorted.length - 1];
  console.log(`  Found ${fullVersion} for Chrome ${major}`);
  return { url: info.download_url, fullVersion };
}

async function resolveCftUrl(major, cftData) {
  const matches = (cftData.versions ?? [])
    .filter(
      (v) =>
        v.version.startsWith(`${major}.`) &&
        v.downloads?.chrome?.some((d) => d.platform === 'linux64'),
    );

  if (matches.length === 0) {
    throw new Error(
      `No linux64 Chrome for Testing download found for major ${major}`,
    );
  }

  const sorted = pickBestVersion(matches.map((v) => [v.version, v]));
  const [, best] = sorted[sorted.length - 1];
  const download = best.downloads.chrome.find((d) => d.platform === 'linux64');
  console.log(`  Found ${best.version} for Chrome ${major}`);
  return { url: download.url, fullVersion: best.version };
}

async function resolveLatestCftUrl() {
  const data = await fetchJson(CFT_LATEST_URL);
  const stable = data.channels?.Stable;
  if (!stable) throw new Error('No Stable channel in CfT last-known-good data');
  const download = stable.downloads?.chrome?.find(
    (d) => d.platform === 'linux64',
  );
  if (!download) throw new Error('No linux64 download in CfT Stable channel');
  console.log(`  Found latest stable ${stable.version}`);
  return { url: download.url, fullVersion: stable.version };
}

// ---------------------------------------------------------------------------
// Per-version setup
// ---------------------------------------------------------------------------

async function setupVersion(entry, manifest, bugazelleData, cftData) {
  const { version } = entry;
  const majorNum = version === 'latest' ? null : parseInt(version, 10);
  const chromeDir = join(CHROME_BINS_DIR, `chrome-${version}`);

  // Idempotency check
  if (manifest[version] && existsSync(manifest[version])) {
    console.log(`✓ Chrome ${version} already set up at ${manifest[version]}`);
    return;
  }

  console.log(`\n→ Setting up Chrome ${version}...`);
  mkdirSync(chromeDir, { recursive: true });

  let url, fullVersion;
  try {
    if (version === 'latest') {
      ({ url, fullVersion } = await resolveLatestCftUrl());
    } else if (majorNum >= 113) {
      ({ url, fullVersion } = await resolveCftUrl(majorNum, cftData));
    } else {
      ({ url, fullVersion } = await resolveBugazelleUrl(majorNum, bugazelleData));
    }
  } catch (err) {
    console.error(`  ✗ Could not resolve download URL: ${err.message}`);
    return;
  }

  const zipPath = join(chromeDir, 'chrome.zip');
  console.log(`  Downloading ${fullVersion}...`);

  try {
    await downloadFile(url, zipPath);
    console.log(`  Extracting...`);
    await extractZip(zipPath, chromeDir);
  } catch (err) {
    console.error(`  ✗ Download/extract failed: ${err.message}`);
    try { unlinkSync(zipPath); } catch { /* ignore */ }
    return;
  } finally {
    if (existsSync(zipPath)) try { unlinkSync(zipPath); } catch { /* ignore */ }
  }

  const execPath = findChromeExecutable(chromeDir);
  if (!execPath) {
    console.error(
      `  ✗ Chrome executable not found in ${chromeDir} after extraction`,
    );
    return;
  }

  chmodSync(execPath, 0o755);
  manifest[version] = execPath;
  console.log(`  ✓ Chrome ${version} ready at ${execPath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const versions = JSON.parse(readFileSync(VERSIONS_PATH, 'utf-8'));
  mkdirSync(CHROME_BINS_DIR, { recursive: true });

  const manifest = existsSync(MANIFEST_PATH)
    ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
    : {};

  const needDownload = versions.filter(
    ({ version }) => !manifest[version] || !existsSync(manifest[version]),
  );

  if (needDownload.length === 0) {
    console.log('All Chrome versions already set up.');
    return;
  }

  console.log(`Setting up ${needDownload.length} Chrome version(s)...`);

  // Determine which data sources we need
  const needsBugazelle = needDownload.some(
    ({ version }) => version !== 'latest' && parseInt(version, 10) < 113,
  );
  const needsCftVersions = needDownload.some(
    ({ version }) => version !== 'latest' && parseInt(version, 10) >= 113,
  );

  let bugazelleData = null;
  let cftData = null;

  if (needsBugazelle) {
    console.log('\nFetching Bugazelle historical archive...');
    try {
      bugazelleData = await fetchJson(BUGAZELLE_URL);
    } catch (err) {
      console.error(`Failed to fetch Bugazelle archive: ${err.message}`);
    }
  }

  if (needsCftVersions) {
    console.log('\nFetching Chrome for Testing version list...');
    try {
      cftData = await fetchJson(CFT_VERSIONS_URL);
    } catch (err) {
      console.error(`Failed to fetch CfT version list: ${err.message}`);
    }
  }

  for (const entry of versions) {
    const { version } = entry;
    const majorNum = parseInt(version, 10);
    const usesBugazelle = version !== 'latest' && majorNum < 113;
    const usesCft = version !== 'latest' && majorNum >= 113;

    if (usesBugazelle && !bugazelleData) {
      console.error(`  ✗ Chrome ${version}: Bugazelle data unavailable, skipping`);
      continue;
    }
    if (usesCft && !cftData) {
      console.error(`  ✗ Chrome ${version}: CfT data unavailable, skipping`);
      continue;
    }

    await setupVersion(entry, manifest, bugazelleData, cftData);
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved to ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
