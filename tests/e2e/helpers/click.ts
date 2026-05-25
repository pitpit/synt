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
    await locator.tap({ position });
  } else {
    await locator.click({ position });
  }
}
