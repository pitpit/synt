import { test, expect } from '@playwright/test';
import { gotoTestRack } from './helpers/fixtures';

test.describe('Web Audio API', () => {
  test('AudioContext constructor is available', async ({ page }) => {
    await gotoTestRack(page);

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
    await gotoTestRack(page);

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

  test('AudioContext reaches running state after user gesture and Tone.start() does not reject', async ({
    page,
  }) => {
    // Intercept AudioContext construction (before app code runs) to capture the
    // instance that Tone.js will create internally — it is not accessible from
    // page.evaluate() in a bundled app.
    await page.addInitScript(() => {
      const W = window as Window & { __capturedAudioCtx?: AudioContext };
      const OrigCtor: typeof AudioContext =
        window.AudioContext ??
        (window as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!OrigCtor) return;

      window.AudioContext = new Proxy(OrigCtor, {
        construct(target, args) {
          const instance = Reflect.construct(target, args) as AudioContext;
          W.__capturedAudioCtx = instance;
          return instance;
        },
      });
      const w = window as { webkitAudioContext?: unknown };
      if (w.webkitAudioContext) w.webkitAudioContext = window.AudioContext;
    });

    // Collect unhandled JS errors — a rejected Tone.start() that is not caught
    // by the app would surface here.
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await gotoTestRack(page);

    // A click counts as a user gesture for the Web Audio API on all platforms
    // (desktop and mobile). Touch tap is covered separately in interactions.spec.ts.
    await page.locator('canvas').first().click();

    // resume() is called within the user-activation window opened by the click
    // above. This is the exact mechanism Tone.start() relies on internally.
    const result = await page.evaluate(async () => {
      const W = window as Window & { __capturedAudioCtx?: AudioContext };
      if (!W.__capturedAudioCtx)
        return { state: 'no-context' as string, error: null as string | null };
      try {
        await W.__capturedAudioCtx.resume();
        return { state: W.__capturedAudioCtx.state as string, error: null };
      } catch (e) {
        return {
          state: W.__capturedAudioCtx.state as string,
          error: String(e),
        };
      }
    });

    expect(
      result.state,
      'AudioContext must reach running state after the user gesture',
    ).toBe('running');
    expect(
      result.error,
      'AudioContext.resume() (the mechanism behind Tone.start()) must not throw',
    ).toBeNull();
    expect(
      pageErrors,
      'No unhandled JS errors — a rejected Tone.start() would appear here',
    ).toHaveLength(0);
  });
});
