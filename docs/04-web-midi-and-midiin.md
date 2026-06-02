# Web MIDI & MidiIn

## Overview

The `MidiIn` module connects a physical or virtual MIDI input device to the Synt audio graph. It acts as an audio gate: when a MIDI trigger is received, the audio signal passes through at a gain proportional to the message velocity; when the matching release message arrives, the gate closes.

## Module layout

```
┌─────────────┐
│  IN   ·  OUT │  Row 0: audio IN (left), audio OUT (right)
└─────────────┘
```

Wiring follows the same pattern as `Gate` and `SwitchOn`:

```
Oscillator → MidiIn (IN→OUT) → Speaker
```

The gain node inside MidiIn is initialised at 0, so no audio passes until a trigger arrives.

## Using MidiIn in the patch

1. **Add** a `MidiIn` tile from the palette (labelled with the DIN-5 connector icon).
2. **Connect** an audio source to its `IN` plug and its `OUT` plug to an audio destination.
3. **Double-click** the tile to open the configuration modal.
4. **Choose** a MIDI input device from the dropdown and click **Save**.
5. **Play** a note (or send any MIDI message) on the selected device. The *first* message received after saving becomes the trigger — no separate "learn" button is needed.
6. Subsequent messages matching the same channel + note/CC number open and close the gate. The gain is `velocity / 127` (0 – 1).

## Implicit learn

MidiIn uses **implicit learn**: there is no arm button. Selecting a new input in the modal and clicking Save puts MidiIn into learn mode automatically. The first message received from that input — whatever it is — becomes the permanent trigger signature until the modal is reopened and a new input is saved.

The learned signature persists across device disconnects and reconnects: if a USB MIDI device is unplugged and replugged, MidiIn re-attaches the listener without resetting the learned signature.

## Gain and velocity

| Message type     | Gain                              |
|------------------|-----------------------------------|
| Note On          | `velocity / 127` (0.0 – 1.0)     |
| Note On vel=0    | `0` (treated as release)          |
| Note Off         | `0`                               |
| CC               | `value / 127` (0.0 – 1.0)        |
| Program Change   | `1.0` (no release; 2-byte format) |
| Channel Pressure | `1.0` (no release; 2-byte format) |

Realtime messages (MIDI clock 0xF8, Active Sensing 0xFE, System Reset 0xFF) and SysEx (0xF0) are silently ignored, even during the learn phase.

## Browser support

| Browser                  | Native Web MIDI | Works with MidiIn |
|--------------------------|-----------------|-------------------|
| Chromium / Chrome        | ✓               | ✓                 |
| Edge                     | ✓               | ✓                 |
| Firefox                  | ✗               | ✗ (no API)        |
| Safari / WebKit          | ✗               | ✗ (no API)        |
| Chrome for Android       | ✓               | ✓                 |

When Web MIDI is unavailable, the modal displays: "Web MIDI API is not supported in this browser."
When access is denied by the browser permission prompt, the modal displays: "MIDI access was denied. Check your browser permissions."

### HTTPS requirement

`navigator.requestMIDIAccess()` requires a **secure context** (HTTPS or `localhost`). The development server (`npm start`) runs on localhost, so permissions should work out of the box.

## Testing

### Integration tests

`tests/integration/control/midiIn.test.ts` covers the full audio graph and MIDI processing logic using the Tone.js mock (no browser required):

- Audio wiring: oscillator → MidiIn → speaker
- Snatch/dispose lifecycle
- `beginLearn()` + `receiveMIDIMessage()` sets gain from velocity
- NoteOff and NoteOn-vel=0 release (gain = 0)
- Non-matching note/channel no-ops
- CC messages
- Realtime message ignored during learn
- Re-learn resets the signature

### E2E tests

`tests/e2e/midi.spec.ts` injects a mock `navigator.requestMIDIAccess` via `addInitScript` so the tests run on all Playwright browser engines without requiring real MIDI hardware:

- Modal opens with the mock input in the dropdown
- Saving an input then sending trigger/release messages produces no console errors
- Modal status line transitions: "Waiting for first message…" → "Learned: …"

The mock helpers live in `tests/e2e/helpers/midi.ts`:

```typescript
await setupMIDIMock(page);   // inject before goto()
await sendMIDIMessage(page, 0x90, 60, 100); // dispatch synthetic MIDI
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Dropdown is empty | No MIDI devices connected or browser denies access | Connect a device, then reopen the modal |
| "Not supported" message | Browser does not implement Web MIDI | Use Chromium/Chrome/Edge |
| "Access denied" message | User dismissed the permission prompt | Click the lock/info icon in the address bar and re-allow MIDI |
| Gate opens but never closes | Trigger learned from a Program Change (2-byte, no release) | Use a Note On/Off or CC message instead |
| No audio after trigger | Audio source not wired to MidiIn IN, or speaker not wired to MidiIn OUT | Check patch cables |
