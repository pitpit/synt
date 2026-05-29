import { expect, test } from '@jest/globals';
import MidiIn from '../../../src/control/MidiIn';
import Speaker from '../../../src/output/Speaker';
import TestOscillator from '../oscillator/TestOscillator';

// Helper to read the current gain value from MidiIn's underlying Tone.js node.
// ToneGain is mocked in tests/__mocks__/tone.ts; gain.value is a plain property.
function gainValue(midiIn: MidiIn): number {
  return (midiIn.audioInputNode as unknown as { gain: { value: number } }).gain.value;
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

  const gainNode = midiIn.audioInputNode;
  midiIn.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(gainNode);
  expect(gainNode.dispose).toHaveBeenCalledTimes(1);
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

test('trigger NoteOn message sets gain from velocity', () => {
  const midiIn = new MidiIn();

  midiIn.beginLearn();
  midiIn.receiveMIDIMessage(0x90, 60, 100); // learn NoteOn Ch1 note 60
  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger

  expect(gainValue(midiIn)).toBeCloseTo(80 / 127);
});

test('NoteOff message after NoteOn trigger resets gain to 0', () => {
  const midiIn = new MidiIn();

  midiIn.beginLearn();
  midiIn.receiveMIDIMessage(0x90, 60, 100); // learn
  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger
  midiIn.receiveMIDIMessage(0x80, 60, 0);   // NoteOff

  expect(gainValue(midiIn)).toBe(0);
});

test('NoteOn velocity 0 treated as release and resets gain to 0', () => {
  const midiIn = new MidiIn();

  midiIn.beginLearn();
  midiIn.receiveMIDIMessage(0x90, 60, 100); // learn
  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger
  midiIn.receiveMIDIMessage(0x90, 60, 0);   // NoteOn vel=0 → release

  expect(gainValue(midiIn)).toBe(0);
});

test('different note on same channel triggers gate at that note velocity', () => {
  const midiIn = new MidiIn();

  midiIn.beginLearn();
  midiIn.receiveMIDIMessage(0x90, 60, 100); // learn (any NoteOn Ch1)
  midiIn.receiveMIDIMessage(0x90, 64, 80);  // different note — still triggers

  expect(gainValue(midiIn)).toBeCloseTo(80 / 127);
});

test('message with different channel does not affect gain', () => {
  const midiIn = new MidiIn();

  midiIn.beginLearn();
  midiIn.receiveMIDIMessage(0x91, 60, 100); // learn Ch2 note 60
  const before = gainValue(midiIn);
  midiIn.receiveMIDIMessage(0x90, 60, 80);  // Ch1 note 60 — different channel

  expect(gainValue(midiIn)).toBe(before);
});

test('realtime message (0xF8 clock) is ignored during learn', () => {
  const midiIn = new MidiIn();

  midiIn.beginLearn();
  midiIn.receiveMIDIMessage(0xf8, 0, 0); // MIDI clock — should be ignored
  // learnPending should still be true; the real trigger should work next
  midiIn.receiveMIDIMessage(0x90, 60, 100); // learn
  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger

  expect(gainValue(midiIn)).toBeCloseTo(80 / 127);
});

test('CC message sets gain from value', () => {
  const midiIn = new MidiIn();

  midiIn.beginLearn();
  midiIn.receiveMIDIMessage(0xb0, 7, 64); // learn CC Ch1 #7 val=64
  midiIn.receiveMIDIMessage(0xb0, 7, 96); // trigger CC val=96

  expect(gainValue(midiIn)).toBeCloseTo(96 / 127);
});

test('beginLearn resets a previously learned signature', () => {
  const midiIn = new MidiIn();

  midiIn.beginLearn();
  midiIn.receiveMIDIMessage(0x90, 60, 100); // learn note 60
  midiIn.receiveMIDIMessage(0x90, 60, 80);  // trigger

  midiIn.beginLearn(); // re-learn
  midiIn.receiveMIDIMessage(0x90, 62, 100); // learn note 62

  const beforeTrigger = gainValue(midiIn);
  midiIn.receiveMIDIMessage(0x90, 60, 80); // old note — no longer matches
  expect(gainValue(midiIn)).toBe(beforeTrigger);

  midiIn.receiveMIDIMessage(0x90, 62, 80); // new note — matches
  expect(gainValue(midiIn)).toBeCloseTo(80 / 127);
});
