import { expect, test } from '@playwright/test';

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

test.describe('Plug connections', () => {
  test('dragging a Speaker adjacent to a TriangleOscillator wires the audio graph', async ({
    page,
  }) => {
    // -------------------------------------------------------------------
    // 1. Inject a spy on AudioNode.prototype.connect BEFORE any page script
    //    runs so every native Web Audio connection is counted, including
    //    the ones Tone.js makes internally on boot.
    // -------------------------------------------------------------------
    await page.addInitScript(() => {
      (window as { __audioConnectCalls?: number }).__audioConnectCalls = 0;
      const origConnect = AudioNode.prototype.connect;
      // The native connect() has two overloads; forward all arguments as-is.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (AudioNode.prototype.connect as (...args: any[]) => any) = function (
        ...args: unknown[]
      ) {
        (window as { __audioConnectCalls?: number }).__audioConnectCalls =
          ((window as { __audioConnectCalls?: number }).__audioConnectCalls ??
            0) + 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (origConnect as (...args: any[]) => any).apply(this, args);
      };
    });

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // -------------------------------------------------------------------
    // 2. Capture baseline: Tone.js wires its own internal graph on boot
    //    (master compressor → destination, etc.) before any user action.
    // -------------------------------------------------------------------
    const connectsAtInit = await page.evaluate(
      () =>
        (window as { __audioConnectCalls?: number }).__audioConnectCalls ?? 0,
    );

    // -------------------------------------------------------------------
    // 3. Perform the drag.
    //
    // Default rack layout (src/index.ts):
    //
    //   (4, 0)  TriangleOscillator   — SOUTH plug = audio OUT
    //   (3, 4)  Speaker              — NORTH plug = audio IN
    //   (4, 1)  <empty>              — the drag target
    //
    // Dragging the Speaker from (3, 4) to the empty slot (4, 1) places it
    // directly south of the TriangleOscillator.  The rack's dragend handler
    // detects the northern neighbour and calls speaker.plug([triOsc, …]),
    // which triggers onSignalChanged and builds the Tone.js audio chain:
    //   ToneOscillator → ToneGain (Speaker) → Tone destination → AudioContext.destination
    // -------------------------------------------------------------------
    const from = modCenter(3, 4); // { x: 354, y: 454 }
    const to = modCenter(4, 1); // { x: 454, y: 154 }

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    // Move in many small steps so Konva fires dragmove events throughout
    // and the internal shadow / grid tracking stays accurate.
    await page.mouse.move(to.x, to.y, { steps: 20 });
    await page.mouse.up();

    // Give Konva's dragend handler and Tone.js audio-graph wiring time to settle.
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------
    // 4. Assertions
    // -------------------------------------------------------------------

    // No JavaScript errors must occur during or after the drag.
    expect(errors).toHaveLength(0);

    // At least one new AudioNode.connect() call must have been made after
    // the drag, confirming that the plug system wired up the audio graph.
    const connectsAfterDrag = await page.evaluate(
      () =>
        (window as { __audioConnectCalls?: number }).__audioConnectCalls ?? 0,
    );
    expect(connectsAfterDrag).toBeGreaterThan(connectsAtInit);
  });
});
