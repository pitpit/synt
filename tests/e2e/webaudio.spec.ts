import { expect, test } from '@playwright/test';

test.describe('Web Audio API', () => {
  test('AudioContext constructor is available', async ({ page }) => {
    await page.goto('/');

    const hasAudioContext = await page.evaluate(
      () =>
        typeof AudioContext !== 'undefined' ||
        typeof (window as { webkitAudioContext?: unknown }).webkitAudioContext !==
          'undefined',
    );

    expect(hasAudioContext).toBe(true);
  });

  test('AudioContext can be instantiated and is in a valid state', async ({
    page,
  }) => {
    await page.goto('/');

    const result = await page.evaluate(() => {
      try {
        const Ctor =
          AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctor) return { ok: false, error: 'No AudioContext constructor' };

        const ctx = new Ctor();
        const state = ctx.state;
        // Do not await close() — evaluate must be synchronous-returning
        ctx.close().catch(() => undefined);

        return { ok: state === 'running' || state === 'suspended', state };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    });

    expect(result.ok).toBe(true);
  });
});
