import Konva from 'konva';
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

test('disconnecting source clears the waveform display', () => {
  const oscillator = new TestOscillator();
  const scope = new Oscilloscope();

  oscillator.plug([null, null, null, null]);
  scope.plug([oscillator, null, null, null]);

  const group = new Konva.Group({ width: 200, height: 100 });
  scope.draw(group);

  // Simulate waveform data already rendered on both channels
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (scope as any).waveformLineLeft.points([10, 50, 20, 40, 30, 60]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (scope as any).waveformLineRight.points([10, 50, 20, 40, 30, 60]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect((scope as any).waveformLineLeft.points()).toHaveLength(6);

  scope.unlink(0); // NORTH

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect((scope as any).waveformLineLeft.points()).toEqual([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect((scope as any).waveformLineRight.points()).toEqual([]);
});

test('re-plugging source after snatch restarts the animation', () => {
  const oscillator = new TestOscillator();
  const scope = new Oscilloscope();

  oscillator.plug([null, null, null, null]);
  scope.plug([oscillator, null, null, null]);

  const group = new Konva.Group({ width: 200, height: 100 });
  scope.draw(group);

  // Simulate a drag: snatch cancels animation and disposes the effect node
  scope.snatch();
  expect((scope as any).animationFrameId).toBeNull();

  // Re-plug (simulates dragend back next to the source)
  oscillator.plug([null, null, null, null]);
  scope.plug([oscillator, null, null, null]);

  // Animation should have been restarted
  expect((scope as any).animationFrameId).not.toBeNull();
});

test('knob connected to WEST sets vertical zoom without throwing', () => {
  const oscillator = new TestOscillator();
  const scope = new Oscilloscope();
  const knob = new Knob();

  oscillator.plug([null, null, null, null]);
  scope.plug([oscillator, null, null, null]);
  knob.plug([null, null, null, null]);

  expect(() => { scope.plug([null, null, null, knob]); }).not.toThrow();

  // At knob value 0 amplitude = 0.1; at 1 amplitude = 10
  // At default 0.5 it equals exactly 1 (geometric midpoint), so check extremes via formula
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect((scope as any).amplitude).toBeCloseTo(1, 5);
});