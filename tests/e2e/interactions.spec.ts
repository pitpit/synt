import { test, expect } from '@playwright/test';
import { gotoTestRack } from './helpers/fixtures';

test.describe('Canvas interactions', () => {
  test('clicking the canvas does not produce JavaScript errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await gotoTestRack(page);

    // Click at the position of the first synthesizer module (top-left slot)
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 50, y: 50 } });

    expect(errors).toHaveLength(0);
  });

  test('canvas remains visible after a click', async ({ page }) => {
    await gotoTestRack(page);

    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 50, y: 50 } });

    await expect(canvas).toBeVisible();
  });

  test('touch tap on the canvas does not produce JavaScript errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await gotoTestRack(page);

    const canvas = page.locator('canvas').first();
    await canvas.tap({ position: { x: 50, y: 50 } });

    expect(errors).toHaveLength(0);
  });
});
