import { defineConfig, devices } from '@playwright/test';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface ChromeVersionEntry {
  version: string;
  device: string;
}

// ---------------------------------------------------------------------------
// Load chrome-versions.json and the binary manifest (if present)
// ---------------------------------------------------------------------------

const chromeVersions = JSON.parse(
  readFileSync(join(__dirname, 'chrome-versions.json'), 'utf-8'),
) as ChromeVersionEntry[];

const manifestPath = join(__dirname, '.chrome-bins', 'manifest.json');
const manifest = (existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf-8'))
  : {}) as Record<string, string>;

// ---------------------------------------------------------------------------
// Build a Playwright device descriptor for a given device name.
// Falls back to a sensible Android mobile profile when the name is not found
// in Playwright's built-in device list.
// ---------------------------------------------------------------------------

function getDevice(deviceName: string): (typeof devices)[string] {
  if (deviceName in devices) return devices[deviceName];

  // Warn once and provide a generic Android profile so the project still runs.
  console.warn(
    `[playwright.config] Device '${deviceName}' not found in Playwright built-in ` +
      `devices — falling back to generic Android viewport.`,
  );
  return {
    viewport: { width: 360, height: 800 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/96.0.4664.93 Mobile Safari/537.36',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium',
  };
}

// ---------------------------------------------------------------------------
// One Playwright project per Chrome version that has a downloaded binary.
// Versions whose binary has not been downloaded yet are silently skipped.
// ---------------------------------------------------------------------------

const chromeProjects = chromeVersions
  .filter(({ version }) => manifest[version] && existsSync(manifest[version]))
  .map(({ version, device }) => ({
    name: `chrome-${version} (${device})`,
    use: {
      ...getDevice(device),
      executablePath: manifest[version],
    },
  }));

// ---------------------------------------------------------------------------
// Playwright configuration
// ---------------------------------------------------------------------------

export default defineConfig({
  testDir: './tests/e2e',

  reporter: [['html'], ['list']],

  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    //video: 'retain-on-failure',
  },

  /**
   * Serve the production build with http-server.
   * `test:e2e` runs `npm run build` before `playwright test`, so dist/ is
   * guaranteed to exist when Playwright starts.
   */
  webServer: {
    command: 'npx http-server dist -p 8080 -s',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    // ----- Static browser projects ----------------------------------------
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          // Firefox does not grant user activation for Web Audio to Playwright's
          // synthetic click events in CI/headless mode, causing AudioContext.resume()
          // to hang indefinitely.  Disabling the autoplay blocking policy here
          // keeps the test environment consistent with Chromium/WebKit.
          firefoxUserPrefs: {
            'media.autoplay.default': 0,
            'media.autoplay.blocking_policy': 0,
          },
        },
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // ----- iOS mobile Safari projects -------------------------------------
    {
      name: 'iPhone SE',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'iPhone 12',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'iPad (gen 7)',
      use: { ...devices['iPad (gen 7)'] },
    },

    // ----- Dynamic Chrome projects (require `npm run setup:chrome` first) --
    ...chromeProjects,
  ],
});
