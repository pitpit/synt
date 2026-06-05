import type { Locator } from '@playwright/test';

/**
 * Clicks or taps a locator using the appropriate input method:
 *
 * - **Desktop** (`isMobile: false`, default): uses `locator.click()`.
 * - **Touch / mobile** (`isMobile: true`): uses `locator.tap()`.
 */
export async function clickOrTap(
  locator: Locator,
  { position, isMobile = false }: { position?: { x: number; y: number }; isMobile?: boolean } = {},
): Promise<void> {
  if (isMobile) {
    // force: true bypasses Playwright's hit-test, which fails when Konva's
    // hit canvas overlays the render canvas at the same coordinates.
    await locator.tap({ position, force: true });
  } else {
    // force: true bypasses Playwright's hit-test, which fails when Konva's
    // hit canvas overlays the render canvas at the same coordinates.
    await locator.click({ position, force: true });
  }
}

/**
 * Double-clicks or double-taps a locator using the appropriate input method:
 *
 * - **Desktop**: uses `locator.dblclick()` with `force: true` to bypass
 *   Playwright's hit-test, which fails when Konva's hit canvas overlays the
 *   render canvas (observed on WebKit and Firefox headless).
 * - **Touch / mobile**: fires two rapid `tap()` calls to trigger Konva's
 *   `dbltap` event, also with `force: true` for the same reason.
 */
export async function dblClickOrDblTap(
  locator: Locator,
  { position, isMobile = false }: { position?: { x: number; y: number }; isMobile?: boolean } = {},
): Promise<void> {
  if (isMobile) {
    await locator.tap({ position, force: true });
    await locator.tap({ position, force: true });
  } else {
    await locator.dblclick({ position, force: true });
  }
}
