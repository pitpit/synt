import type { Page } from '@playwright/test';

/**
 * Drags from `from` to `to` using the appropriate input method:
 *
 * - **Touch / mobile** (`isMobile: true`): dispatches TouchEvent sequences
 *   directly via `page.evaluate`.  Falls back to MouseEvent when the
 *   Touch(dict) constructor is unavailable (Playwright WebKit).
 *
 *   Konva 9.x touch drag internals:
 *     - 'touchstart'  on the canvas  → _createDragElement
 *     - 'touchmove'   on window      → DD._drag (position update)
 *     - 'touchend'    on window      → DD._endDragBefore / _endDragAfter
 *
 * - **Desktop** (`isMobile: false`): uses `page.mouse` (move → down → move
 *   with steps → up), which Playwright translates into the native input
 *   events that Konva's mousedown.konva / mousemove / mouseup handlers
 *   consume.
 */
export async function dragDrop(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  { steps = 20, isMobile = false }: { steps?: number; isMobile?: boolean } = {},
): Promise<void> {
  if (isMobile) {
    await page.evaluate(
      ({
        from,
        to,
        steps,
      }: {
        from: { x: number; y: number };
        to: { x: number; y: number };
        steps: number;
      }) => {
        const canvas = document.querySelector('canvas')!;

        function makeTouch(x: number, y: number): Touch | null {
          try {
            return new Touch({
              identifier: 1,
              target: canvas,
              clientX: x,
              clientY: y,
              pageX: x,
              pageY: y,
              radiusX: 1,
              radiusY: 1,
              rotationAngle: 0,
              force: 1,
            });
          } catch {
            // Touch(dict) constructor not available (Playwright WebKit).
            console.warn(
              'Touch constructor unavailable — falling back to MouseEvent for drag simulation',
            );
            return null;
          }
        }

        const t0 = makeTouch(from.x, from.y);

        if (t0 !== null) {
          // --- Touch event path (Chrome / Android) ---
          canvas.dispatchEvent(
            new TouchEvent('touchstart', {
              touches: [t0],
              changedTouches: [t0],
              bubbles: true,
              cancelable: true,
            }),
          );

          for (let i = 1; i <= steps; i++) {
            const x = from.x + ((to.x - from.x) * i) / steps;
            const y = from.y + ((to.y - from.y) * i) / steps;
            const t = makeTouch(x, y)!;
            window.dispatchEvent(
              new TouchEvent('touchmove', {
                touches: [t],
                changedTouches: [t],
                bubbles: true,
                cancelable: true,
              }),
            );
          }

          const tEnd = makeTouch(to.x, to.y)!;
          window.dispatchEvent(
            new TouchEvent('touchend', {
              touches: [],
              changedTouches: [tEnd],
              bubbles: true,
              cancelable: true,
            }),
          );
        } else {
          // --- Mouse event fallback (Playwright WebKit) ---
          canvas.dispatchEvent(
            new MouseEvent('mousedown', {
              clientX: from.x,
              clientY: from.y,
              bubbles: true,
              cancelable: true,
            }),
          );

          for (let i = 1; i <= steps; i++) {
            const x = from.x + ((to.x - from.x) * i) / steps;
            const y = from.y + ((to.y - from.y) * i) / steps;
            window.dispatchEvent(
              new MouseEvent('mousemove', {
                clientX: x,
                clientY: y,
                bubbles: true,
                cancelable: true,
              }),
            );
          }

          window.dispatchEvent(
            new MouseEvent('mouseup', {
              clientX: to.x,
              clientY: to.y,
              bubbles: true,
              cancelable: true,
            }),
          );
        }
      },
      { from, to, steps },
    );
  } else {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps });
    await page.mouse.up();
  }
}
