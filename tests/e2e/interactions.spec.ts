import { test, expect } from '@playwright/test';
import { gotoTestRack } from './helpers/fixtures';
import { clickOrTap } from './helpers/click';

test.describe('Canvas interactions', () => {
  test('interacting with the canvas does not produce JavaScript errors', async ({
    page,
    isMobile,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await gotoTestRack(page);

    // Click or tap at the position of the first synthesizer module (top-left slot)
    const canvas = page.locator('canvas').first();
    await clickOrTap(canvas, { position: { x: 50, y: 50 }, isMobile });

    expect(errors).toHaveLength(0);
  });

  test('canvas remains visible after interaction', async ({ page, isMobile }) => {
    await gotoTestRack(page);

    const canvas = page.locator('canvas').first();
    await clickOrTap(canvas, { position: { x: 50, y: 50 }, isMobile });

    await expect(canvas).toBeVisible();
  });

});
