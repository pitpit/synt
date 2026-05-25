import { Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

const testYaml = readFileSync(join(__dirname, '../../../public/test.synt.yaml'), 'utf-8');

/**
 * Navigates to `/`, waits for the app to be fully idle, then loads the test
 * rack fixture (`public/test.synt.yaml`) via the app's `window.synt.importRack()`
 * API.
 *
 * Place any `page.addInitScript()` or `page.on(...)` calls BEFORE this call
 * so they are registered prior to navigation.
 */
export async function gotoTestRack(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.evaluate((yaml) => (window as any).synt.importRack(yaml), testYaml);
}
