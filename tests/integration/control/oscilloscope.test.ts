import Oscilloscope from '../../../src/control/Oscilloscope';
import Speaker from '../../../src/output/Speaker';
import Knob from '../../../src/control/Knob';
import TestOscillator from '../oscillator/TestOscillator';

test('oscilloscope passes audio through: osc → scope → speaker', () => {
  const oscillator = new TestOscillator();
  const scope = new Oscilloscope();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  scope.plug([oscillator, null, null, null]);
  speaker.plug([scope, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(scope.node);
  expect(scope.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('snatch oscilloscope does not throw', () => {
  const oscillator = new TestOscillator();
  const scope = new Oscilloscope();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  scope.plug([oscillator, null, null, null]);
  speaker.plug([scope, null, null, null]);

  expect(() => { scope.snatch(); }).not.toThrow();
});

test('snatch oscilloscope disconnects and disposes waveform node', () => {
  const oscillator = new TestOscillator();
  const scope = new Oscilloscope();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  scope.plug([oscillator, null, null, null]);
  speaker.plug([scope, null, null, null]);

  const scopeNode = scope.node;
  const speakerInput = speaker.audioInputNode;
  scope.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(scopeNode);
  expect(scopeNode?.disconnect).toHaveBeenCalledWith(speakerInput);
  expect(scopeNode?.dispose).toHaveBeenCalledTimes(1);
});

test('knob connected to EAST sets trigger level without throwing', () => {
  const oscillator = new TestOscillator();
  const scope = new Oscilloscope();
  const speaker = new Speaker();
  const knob = new Knob();

  oscillator.plug([null, null, null, null]);
  scope.plug([oscillator, null, null, null]);
  speaker.plug([scope, null, null, null]);
  knob.plug([null, null, null, null]);
  scope.plug([null, knob, null, null]);

  expect(() => { knob.plug([null, null, null, null]); }).not.toThrow();
});
