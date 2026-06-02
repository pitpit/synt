import type { Page } from '@playwright/test';

// Shape exposed on window by the MIDI mock injected via addInitScript.
interface MidiMockWindow {
  __midiMockInput?: {
    id: string;
    name: string;
    onmidimessage: ((e: { data: Uint8Array }) => void) | null;
  };
}

/**
 * Injects a minimal `navigator.requestMIDIAccess` mock before page navigation.
 * The mock exposes one named MIDI input ("Mock MIDI Input") and stores a
 * reference on `window.__midiMockInput` so `sendMIDIMessage()` can dispatch
 * synthetic events to it.
 *
 * Must be called BEFORE `page.goto()` so the script runs from the first load.
 */
export async function setupMIDIMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const mockInput = {
      id: 'mock-input-1',
      name: 'Mock MIDI Input',
      type: 'input',
      state: 'connected',
      manufacturer: '',
      version: '',
      connection: 'open',
      onmidimessage: null as ((e: { data: Uint8Array }) => void) | null,
      onstatechange: null,
      open: () => Promise.resolve(mockInput),
      close: () => Promise.resolve(mockInput),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    };

    const mockAccess = {
      inputs: new Map([['mock-input-1', mockInput]]),
      outputs: new Map(),
      sysexEnabled: false,
      onstatechange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    };

    // Expose input reference for sendMIDIMessage()
    (window as unknown as MidiMockWindow).__midiMockInput = mockInput;

    // Override the MIDI API
    (navigator as unknown as Record<string, unknown>).requestMIDIAccess =
      () => Promise.resolve(mockAccess);
  });
}

/**
 * Dispatches a synthetic MIDI message to the mocked input port.
 * The message is delivered to any `onmidimessage` listener currently attached
 * to the mock input — which MidiIn sets after the user saves the modal.
 *
 * @param status - MIDI status byte (e.g. 0x90 = Note On Ch1)
 * @param data1  - First data byte (e.g. note number)
 * @param data2  - Second data byte (e.g. velocity); use 127 for 2-byte messages
 */
/**
 * Simulates a browser that does not implement the Web MIDI API at all
 * (e.g. Firefox, Safari without a MIDI extension).  Must be called BEFORE
 * `page.goto()`.
 */
export async function setupMIDIUnsupported(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      get: () => undefined,
      configurable: true,
    });
  });
}

/**
 * Simulates a browser where the user has denied MIDI permission (or the
 * permission prompt is blocked).  `requestMIDIAccess` is present but rejects
 * with a `SecurityError` DOMException.  Must be called BEFORE `page.goto()`.
 */
export async function setupMIDIDenied(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      get: () => () => Promise.reject(new DOMException('Permission denied', 'SecurityError')),
      configurable: true,
    });
  });
}

export async function sendMIDIMessage(
  page: Page,
  status: number,
  data1: number,
  data2: number,
): Promise<void> {
  await page.evaluate(
    ({ s, d1, d2 }) => {
      const input = (window as unknown as MidiMockWindow).__midiMockInput;
      if (input?.onmidimessage) {
        input.onmidimessage({ data: new Uint8Array([s, d1, d2]) });
      }
    },
    { s: status, d1: data1, d2: data2 },
  );
}
