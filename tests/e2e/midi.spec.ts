import { test, expect } from '@playwright/test';
import { setupMIDIMock, sendMIDIMessage } from './helpers/midi';

// Rack layout constants — must stay in sync with src/core/Rack.ts
const SLOT = 100;
const PAD = 4;

function modCenter(x: number, y: number): { x: number; y: number } {
  return { x: PAD + x * SLOT + SLOT / 2, y: PAD + y * SLOT + SLOT / 2 };
}

// Minimal rack YAML containing a single MidiIn at grid position (0, 0).
const MIDI_TEST_YAML = `\
# yaml-language-server: $schema=https://raw.githubusercontent.com/pitpit/synt/main/synt.schema.json
synt:
  mods:
    - type: MidiIn
      x: 0
      y: 0
`;

/**
 * Navigate to the app and import a rack containing one MidiIn module.
 * Must be called AFTER any addInitScript() calls.
 */
async function gotoMidiRack(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/synt/');
  await page.waitForLoadState('networkidle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.evaluate((yaml) => (window as any).synt.importRack(yaml), MIDI_TEST_YAML);
}

test.describe('MidiIn — Web MIDI integration', () => {
  test('double-click opens modal with MIDI input dropdown', async ({ page, isMobile }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await setupMIDIMock(page);
    await gotoMidiRack(page);

    const canvas = page.locator('canvas').first();
    const center = modCenter(0, 0);

    if (isMobile) {
      // Two rapid taps to trigger Konva's dbltap event
      await canvas.tap({ position: center });
      await canvas.tap({ position: center });
    } else {
      await canvas.dblclick({ position: center });
    }

    // Wait for the async requestMIDIAccess() to resolve and the modal to render
    await page.waitForSelector('#midiin-input-select', { timeout: 3000 });

    // Mock input must appear as an option
    const optionCount = await page.locator('#midiin-input-select option').count();
    expect(optionCount).toBeGreaterThan(0);

    const firstOptionText = await page
      .locator('#midiin-input-select option')
      .first()
      .textContent();
    expect(firstOptionText).toBe('Mock MIDI Input');

    expect(errors).toHaveLength(0);
  });

  test('saving selected input then receiving trigger/release messages produces no errors', async ({
    page,
    isMobile,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await setupMIDIMock(page);
    await gotoMidiRack(page);

    const canvas = page.locator('canvas').first();
    const center = modCenter(0, 0);

    // Open modal
    if (isMobile) {
      await canvas.tap({ position: center });
      await canvas.tap({ position: center });
    } else {
      await canvas.dblclick({ position: center });
    }

    await page.waitForSelector('#midiin-input-select', { timeout: 3000 });

    // Save with the mock input selected (it is the only option)
    await page.locator('.tingle-btn--primary').click();

    // Give the modal close and listener attachment a moment to settle
    await page.waitForTimeout(100);

    // First message from the selected input becomes the learned trigger
    await sendMIDIMessage(page, 0x90, 60, 100); // Note On Ch1 C4 — learned as trigger
    await page.waitForTimeout(50);

    // Trigger with velocity
    await sendMIDIMessage(page, 0x90, 60, 80);  // Note On Ch1 C4 vel 80
    await page.waitForTimeout(50);

    // Release
    await sendMIDIMessage(page, 0x80, 60, 0);   // Note Off Ch1 C4
    await page.waitForTimeout(50);

    expect(errors).toHaveLength(0);
  });

  test('modal shows "Waiting for first message" after saving with no prior learn', async ({
    page,
    isMobile,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await setupMIDIMock(page);
    await gotoMidiRack(page);

    const canvas = page.locator('canvas').first();
    const center = modCenter(0, 0);

    // Open, save, then re-open to verify status line
    if (isMobile) {
      await canvas.tap({ position: center });
      await canvas.tap({ position: center });
    } else {
      await canvas.dblclick({ position: center });
    }
    await page.waitForSelector('#midiin-input-select', { timeout: 3000 });
    await page.locator('.tingle-btn--primary').click();
    await page.waitForTimeout(100);

    // Re-open the modal — should show "Waiting for first message…"
    if (isMobile) {
      await canvas.tap({ position: center });
      await canvas.tap({ position: center });
    } else {
      await canvas.dblclick({ position: center });
    }
    await page.waitForSelector('#midiin-input-select', { timeout: 3000 });

    const bodyText = await page.locator('.tingle-modal__box').textContent();
    expect(bodyText).toContain('Waiting for first message');

    expect(errors).toHaveLength(0);
  });

  test('modal shows learned signature after first trigger message', async ({
    page,
    isMobile,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await setupMIDIMock(page);
    await gotoMidiRack(page);

    const canvas = page.locator('canvas').first();
    const center = modCenter(0, 0);

    // Open, save with mock input selected
    if (isMobile) {
      await canvas.tap({ position: center });
      await canvas.tap({ position: center });
    } else {
      await canvas.dblclick({ position: center });
    }
    await page.waitForSelector('#midiin-input-select', { timeout: 3000 });
    await page.locator('.tingle-btn--primary').click();
    await page.waitForTimeout(100);

    // Send a MIDI message — it becomes the learned trigger
    await sendMIDIMessage(page, 0x90, 60, 100); // Note On Ch1 C4
    await page.waitForTimeout(50);

    // Re-open modal to see learned state
    if (isMobile) {
      await canvas.tap({ position: center });
      await canvas.tap({ position: center });
    } else {
      await canvas.dblclick({ position: center });
    }
    await page.waitForSelector('#midiin-input-select', { timeout: 3000 });

    const bodyText = await page.locator('.tingle-modal__box').textContent();
    expect(bodyText).toContain('Learned:');
    expect(bodyText).toContain('Note On');

    expect(errors).toHaveLength(0);
  });
});
