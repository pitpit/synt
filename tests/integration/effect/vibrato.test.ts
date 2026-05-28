import Speaker from '../../../src/output/Speaker';
import Vibrato from '../../../src/effect/Vibrato';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 vibrato + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const vibrato = new Vibrato();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  vibrato.plug([oscillator, null, null, null]);
  speaker.plug([vibrato, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(vibrato.node);
  expect(vibrato.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('1 oscillator + 1 vibrato + 1 speaker - snatch vibrato does not throw', () => {
  const oscillator = new TestOscillator();
  const vibrato = new Vibrato();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  vibrato.plug([oscillator, null, null, null]);
  speaker.plug([vibrato, null, null, null]);

  expect(() => { vibrato.snatch(); }).not.toThrow();
});

test('1 oscillator + 1 vibrato + 1 speaker - snatch vibrato disconnects', () => {
  const oscillator = new TestOscillator();
  const vibrato = new Vibrato();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  vibrato.plug([oscillator, null, null, null]);
  speaker.plug([vibrato, null, null, null]);

  const vibratoNode = vibrato.node;
  const speakerGain = speaker.audioInputNode;
  vibrato.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(vibratoNode);
  expect(vibratoNode?.disconnect).toHaveBeenCalledWith(speakerGain);
  expect(vibratoNode?.dispose).toHaveBeenCalledTimes(1);
});

test('1 oscillator + 1 vibrato + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const vibrato = new Vibrato();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  vibrato.plug([oscillator, null, null, null]);
  speaker.plug([vibrato, null, null, null]);

  const oscNode = oscillator.node;
  const vibratoNode = vibrato.node;

  expect(() => { oscillator.snatch(); }).not.toThrow();
  expect(oscNode?.disconnect).toHaveBeenCalledWith(vibratoNode);
});


