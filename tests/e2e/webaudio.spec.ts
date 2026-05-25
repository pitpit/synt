import { test, expect } from '@playwright/test';
import { gotoTestRack } from './helpers/fixtures';
import { clickOrTap } from './helpers/click';

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
    isMobile,
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

    // Register a one-shot mousedown/touchstart listener BEFORE the click so that
    // resume() is invoked from within the user-activation window — the same
    // mechanism Tone.start() relies on internally.  Calling resume() from a
    // separate page.evaluate() would be outside that window and would cause
    // Firefox (which enforces the autoplay policy strictly in CI/headless) to
    // queue the promise indefinitely, timing out the test.
    await page.evaluate(() => {
      const W = window as Window & {
        __capturedAudioCtx?: AudioContext;
        __resumeSettled?: { error: string | null };
      };
      const handler = () => {
        document.removeEventListener('mousedown', handler);
        document.removeEventListener('touchstart', handler);
        if (!W.__capturedAudioCtx) {
          W.__resumeSettled = { error: null };
          return;
        }
        W.__capturedAudioCtx
          .resume()
          .then(() => {
            W.__resumeSettled = { error: null };
          })
          .catch((e: unknown) => {
            W.__resumeSettled = { error: String(e) };
          });
      };
      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler);
    });

    // A click or tap counts as a user gesture for the Web Audio API on all platforms.
    await clickOrTap(page.locator('canvas').first(), { isMobile });

    // Wait for the resume() triggered inside the event handler above to settle.
    const resultHandle = await page.waitForFunction(() => {
      const W = window as Window & {
        __capturedAudioCtx?: AudioContext;
        __resumeSettled?: { error: string | null };
      };
      if (!W.__resumeSettled) return null; // resume() promise still pending
      return {
        state: (W.__capturedAudioCtx?.state ?? 'no-context') as string,
        error: W.__resumeSettled.error,
      };
    });
    const result = await resultHandle.jsonValue();

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
