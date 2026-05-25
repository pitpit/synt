import { test, expect } from '@playwright/test';
import { gotoTestRack } from './helpers/fixtures';

test.describe('App bootstrap', () => {
  test('loads without JavaScript console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await gotoTestRack(page);

    expect(errors).toHaveLength(0);
  });

  test('canvas element is visible', async ({ page }) => {
    await gotoTestRack(page);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('canvas has non-zero dimensions', async ({ page }) => {
    await gotoTestRack(page);

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('rack container div is present in the DOM', async ({ page }) => {
    await gotoTestRack(page);

    await expect(page.locator('#container')).toBeAttached();
  });
});
