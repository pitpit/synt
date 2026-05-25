import { test, expect } from '@playwright/test';
import { gotoTestRack } from './helpers/fixtures';
import { dragDrop } from './helpers/drag';

// Rack layout constants — must stay in sync with src/core/Rack.ts
const SLOT = 100; // slotWidth = slotHeight (px)
const PAD = 4; // padding (px)

/**
 * Returns the viewport pixel coordinate of the centre of the module
 * sitting at rack grid position (x, y).
 *
 * Formula: centre = PAD + gridIndex * SLOT + SLOT/2
 *   e.g. grid (3, 4) → { x: 354, y: 454 }
 *
 * This assumes the Konva stage is at scale 1 and position (0, 0), which is
 * the initial state before any user zoom/pan.
 */
function modCenter(x: number, y: number): { x: number; y: number } {
  return {
    x: PAD + x * SLOT + SLOT / 2,
    y: PAD + y * SLOT + SLOT / 2,
  };
}

/**
 * Injects a counter for 'test:mod:link' CustomEvents dispatched by Mod.ts.
 * Must be called before page.goto() so the listener is in place from the
 * very first script execution.
 */
async function setupModLinkSpy(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    (window as { __modLinkCount?: number }).__modLinkCount = 0;
    window.addEventListener('test:mod:link', () => {
      (window as { __modLinkCount?: number }).__modLinkCount =
        ((window as { __modLinkCount?: number }).__modLinkCount ?? 0) + 1;
    });
  });
}

test.describe('Plug connections', () => {
  test('dragging a Speaker wires the audio graph', async ({ page, isMobile }) => {
    // -------------------------------------------------------------------
    // 1. Count Mod.link() calls via 'test:mod:link' CustomEvent dispatched
    //    by Mod.ts — no browser-API prototype patching required.
    // -------------------------------------------------------------------
    await setupModLinkSpy(page);

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await gotoTestRack(page);

    // -------------------------------------------------------------------
    // 2. Perform the drag.
    //
    // Default rack layout (src/index.ts):
    //
    //   (0, 3)  SwitchOn  — SOUTH plug = audio OUT
    //   (0, 4)  Speaker   — NORTH plug = audio IN
    //
    // Dragging the Speaker from (0, 4) toward the occupied slot (0, 3)
    // causes it to snap back to (0, 4) on dragend.  plug() fires and
    // connects Speaker.NORTH (IN) to SwitchOn.SOUTH (OUT), wiring the
    // audio graph.
    //
    // Coordinates stay within the smallest test viewport (320 × 568 px on
    // Galaxy S9+ / iPhone SE).  dragDrop() uses page.mouse on desktop and
    // dispatches TouchEvents (with a MouseEvent fallback for WebKit) on
    // mobile — no test.skip needed.
    // -------------------------------------------------------------------
    const from = modCenter(0, 4); // Speaker   — { x: 54, y: 454 }
    const to   = modCenter(0, 3); // SwitchOn  — { x: 54, y: 354 }

    await dragDrop(page, from, to, { isMobile });

    // Give Konva's dragend handler and Tone.js audio-graph wiring time to settle.
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------
    // 3. Assertions
    // -------------------------------------------------------------------

    // No JavaScript errors must occur during or after the drag.
    expect(errors).toHaveLength(0);

    // At least one Mod.link() call must have fired after the drag,
    // confirming that the plug system connected the modules.
    const linkCount = await page.evaluate(
      () => (window as { __modLinkCount?: number }).__modLinkCount ?? 0,
    );
    expect(linkCount).toBeGreaterThan(0);
  });
});
