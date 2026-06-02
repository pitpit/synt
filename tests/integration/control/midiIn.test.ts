import { expect, test } from '@jest/globals';
import MidiIn from '../../../src/control/MidiIn';
import Speaker from '../../../src/output/Speaker';
import TestOscillator from '../oscillator/TestOscillator';
import ControlSignal from '../../../src/core/ControlSignal';
import PlugPosition from '../../../src/core/PlugPosition';

// Helper to access the mock AmplitudeEnvelope node on MidiIn.
function envelopeNode(midiIn: MidiIn) {
  return midiIn.audioInputNode as unknown as {
    triggerAttack: jest.Mock;
    triggerRelease: jest.Mock;
  };
}

// Helper to read the current CTRLOUT (WEST plug) signal value.
function ctrlOutValue(midiIn: MidiIn): number | null {
  const signals = (midiIn as unknown as { outputSignals: (ControlSignal | null)[] }).outputSignals;
  return signals[PlugPosition.WEST]?.value ?? null;
}

test('1 oscillator + 1 midiIn + 1 speaker connects audio graph', () => {
  const oscillator = new TestOscillator();
  const midiIn = new MidiIn();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  midiIn.plug([oscillator, null, null, null]);
  speaker.plug([midiIn, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(midiIn.audioInputNode);
  expect(midiIn.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('snatch midiIn disconnects oscillator and disposes gain node', () => {
  const oscillator = new TestOscillator();
  const midiIn = new MidiIn();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  midiIn.plug([oscillator, null, null, null]);
  speaker.plug([midiIn, null, null, null]);

  const envNode = midiIn.audioInputNode;
  midiIn.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(envNode);
  expect(envNode.dispose).toHaveBeenCalledTimes(1);
});

test('snatch oscillator disconnects from midiIn', () => {
  const oscillator = new TestOscillator();
  const midiIn = new MidiIn();

  oscillator.plug([null, null, null, null]);
  midiIn.plug([oscillator, null, null, null]);

  const oscNode = oscillator.node;
  const gainNode = midiIn.audioInputNode;
  oscillator.snatch();

  expect(oscNode?.disconnect).toHaveBeenCalledWith(gainNode);
});

test('trigger NoteOn message triggers attack with velocity', () => {
  const midiIn = new MidiIn();

  midiIn.receiveMIDIMessage(0x90, 60, 80);

  expect(envelopeNode(midiIn).triggerAttack).toHaveBeenLastCalledWith(undefined, 80 / 127);
});

test('NoteOff message after NoteOn trigger releases envelope', () => {
  const midiIn = new MidiIn();

  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger
  midiIn.receiveMIDIMessage(0x80, 60, 0);   // NoteOff

  expect(envelopeNode(midiIn).triggerRelease).toHaveBeenCalled();
});

test('NoteOn velocity 0 treated as release — triggers release', () => {
  const midiIn = new MidiIn();

  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger
  midiIn.receiveMIDIMessage(0x90, 60, 0);   // NoteOn vel=0 → release (same note)

  expect(envelopeNode(midiIn).triggerRelease).toHaveBeenCalled();
});

test('NoteOn velocity 0 for a NEW note triggers attack with default velocity (device sends vel-0 always)', () => {
  const midiIn = new MidiIn();

  midiIn.receiveMIDIMessage(0x90, 64, 0);   // press note 64 with vel=0 → default 64/127

  expect(envelopeNode(midiIn).triggerAttack).toHaveBeenLastCalledWith(undefined, 64 / 127);
});

test('any NoteOn triggers envelope at that note velocity', () => {
  const midiIn = new MidiIn();

  midiIn.receiveMIDIMessage(0x90, 64, 80);

  expect(envelopeNode(midiIn).triggerAttack).toHaveBeenLastCalledWith(undefined, 80 / 127);
});

test('realtime message (0xF8 clock) is ignored', () => {
  const midiIn = new MidiIn();

  midiIn.receiveMIDIMessage(0xf8, 0, 0); // MIDI clock — should be ignored
  midiIn.receiveMIDIMessage(0x90, 60, 80);

  expect(envelopeNode(midiIn).triggerAttack).toHaveBeenLastCalledWith(undefined, 80 / 127);
});

// ---------------------------------------------------------------------------
// CTRLOUT (WEST plug) — pitch CV
// ---------------------------------------------------------------------------

test('pitch mode: CTRLOUT outputs noteToCV on NoteOn trigger', () => {
  const midiIn = new MidiIn();
  midiIn.receiveMIDIMessage(0x90, 69, 80);  // A4 (note 69)

  const expected = 440 * Math.pow(2, (69 - 69) / 12) / 400; // 1.1
  expect(ctrlOutValue(midiIn)).toBeCloseTo(expected);
});

test('pitch mode: second note on same channel updates CTRLOUT to new pitch', () => {
  const midiIn = new MidiIn();
  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger note 60
  midiIn.receiveMIDIMessage(0x90, 69, 80);  // trigger note 69 (A4) while 60 still held

  const expected = 440 * Math.pow(2, (69 - 69) / 12) / 400; // CV for A4
  expect(ctrlOutValue(midiIn)).toBeCloseTo(expected);
});

test('pitch mode: CTRLOUT holds last pitch on NoteOff release (allows envelope release to complete)', () => {
  const midiIn = new MidiIn();
  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger note 60
  const pitchAfterNoteOn = ctrlOutValue(midiIn);
  midiIn.receiveMIDIMessage(0x80, 60, 0);   // NoteOff

  expect(ctrlOutValue(midiIn)).toBe(pitchAfterNoteOn);
});

// ---------------------------------------------------------------------------
// Oscillator frequency (end-to-end CTRLOUT → CTRLIN)
// ---------------------------------------------------------------------------

test('pitch mode: pressing a note updates connected oscillator frequency', () => {
  const midiIn = new MidiIn();
  const oscillator = new TestOscillator();

  // Connect MidiIn CTRLOUT (WEST) → Oscillator CTRLIN (EAST)
  midiIn.plug([null, null, null, oscillator]);

  midiIn.receiveMIDIMessage(0x90, 69, 80);  // A4 (note 69)

  expect(oscillator.node?.frequency.value).toBeCloseTo(440);
});

test('pitch mode: pressing a second note updates connected oscillator frequency', () => {
  const midiIn = new MidiIn();
  const oscillator = new TestOscillator();

  midiIn.plug([null, null, null, oscillator]);

  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger note 60

  const freqBefore = oscillator.node?.frequency.value;

  midiIn.receiveMIDIMessage(0x90, 69, 80);  // trigger note 69 while 60 held

  expect(oscillator.node?.frequency.value).toBeCloseTo(440);
  expect(oscillator.node?.frequency.value).not.toBeCloseTo(freqBefore as number);
});

// ---------------------------------------------------------------------------
// Polyphonic / overlapping notes
// ---------------------------------------------------------------------------

test('releasing first note (vel-0) while second note is held does not silence output', () => {
  const midiIn = new MidiIn();

  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger note 60
  midiIn.receiveMIDIMessage(0x90, 65, 80);  // press note 65 — second pitch signal
  // NoteOn-vel-0 for note 60 (not the active note 65): treated as a new press
  // with default velocity — activeNote becomes 60, attack triggered at 64/127.
  midiIn.receiveMIDIMessage(0x90, 60, 0);

  expect(envelopeNode(midiIn).triggerAttack).toHaveBeenLastCalledWith(undefined, 64 / 127); // default vel, output is non-zero
});

test('releasing active note (vel-0) while no other note held silences output', () => {
  const midiIn = new MidiIn();

  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger
  midiIn.receiveMIDIMessage(0x90, 60, 0);   // release same note via vel-0

  expect(envelopeNode(midiIn).triggerRelease).toHaveBeenCalled();
});

test('device that always sends vel=0: NoteOn triggers, NoteOff releases', () => {
  const midiIn = new MidiIn();

  midiIn.receiveMIDIMessage(0x90, 36, 0); // press note 36 (vel=0 → default 64/127)
  expect(envelopeNode(midiIn).triggerAttack).toHaveBeenLastCalledWith(undefined, 64 / 127);

  midiIn.receiveMIDIMessage(0x80, 36, 0); // NoteOff → release
  expect(envelopeNode(midiIn).triggerRelease).toHaveBeenCalled();

  midiIn.receiveMIDIMessage(0x90, 48, 0); // press another note
  expect(envelopeNode(midiIn).triggerAttack).toHaveBeenLastCalledWith(undefined, 64 / 127);

  midiIn.receiveMIDIMessage(0x80, 48, 0); // release
  expect(envelopeNode(midiIn).triggerRelease).toHaveBeenCalledTimes(2);
});


