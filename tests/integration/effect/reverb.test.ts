import Speaker from '../../../src/output/Speaker';
import Reverb from '../../../src/effect/Reverb';
import AudioSignal from '../../../src/core/AudioSignal';
import BrokenAudioSignal from '../../../src/core/BrokenAudioSignal';
import ControlSignal from '../../../src/core/ControlSignal';
import PlugPosition from '../../../src/core/PlugPosition';
import Knob from '../../../src/control/Knob';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 reverb + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const reverb = new Reverb();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  oscillator.plug([null, null, null, null]);
  reverb.plug([oscillator, null, null, null]);
  speaker.plug([reverb, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(reverb.node));

  spy.mockRestore();
});

test('1 oscillator + 1 reverb + 1 speaker - snatch reverb does not throw', () => {
  const oscillator = new TestOscillator();
  const reverb = new Reverb();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  reverb.plug([oscillator, null, null, null]);
  speaker.plug([reverb, null, null, null]);

  expect(() => { reverb.snatch(); }).not.toThrow();
});

test('1 oscillator + 1 reverb + 1 speaker - snatch reverb disconnects speaker', async () => {
  const oscillator = new TestOscillator();
  const reverb = new Reverb();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  reverb.plug([oscillator, null, null, null]);
  speaker.plug([reverb, null, null, null]);

  const nodeBeforeSnatch = reverb.node;
  reverb.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new BrokenAudioSignal(nodeBeforeSnatch));

  await Promise.resolve(); // flush queueMicrotask to trigger deferred dispose
  expect(nodeBeforeSnatch?.dispose).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

test('1 oscillator + 1 reverb + 1 speaker - snatch oscillator disconnects speaker', () => {
  const oscillator = new TestOscillator();
  const reverb = new Reverb();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  reverb.plug([oscillator, null, null, null]);
  speaker.plug([reverb, null, null, null]);

  expect(() => { oscillator.snatch(); }).not.toThrow();

  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

test('CV on EAST sets reverb decay', () => {
  const oscillator = new TestOscillator();
  const reverb = new Reverb();
  const speaker = new Speaker();
  const knob = new Knob();

  oscillator.plug([null, null, null, null]);
  knob.plug([null, null, null, null]);
  // EAST (index 1) of reverb connects to the WEST plug of knob (opposite side)
  reverb.plug([oscillator, knob, null, null]);
  speaker.plug([reverb, null, null, null]);

  knob.pushOutput(PlugPosition.WEST, new ControlSignal(0.5));

  expect(reverb.node?.decay).toBe(5); // 0.5 * 10
});

test('CV on WEST sets reverb wet value', () => {
  const oscillator = new TestOscillator();
  const reverb = new Reverb();
  const speaker = new Speaker();
  const knob = new Knob();

  oscillator.plug([null, null, null, null]);
  knob.plug([null, null, null, null]);
  // WEST (index 3) of reverb connects to the EAST plug of knob (opposite side)
  reverb.plug([oscillator, null, null, knob]);
  speaker.plug([reverb, null, null, null]);

  knob.pushOutput(PlugPosition.EAST, new ControlSignal(0.75));

  expect(reverb.node?.wet.value).toBe(0.75);
});
