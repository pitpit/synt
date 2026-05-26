import Speaker from '../../../src/output/Speaker';
import Vibrato from '../../../src/effect/Vibrato';
import AudioSignal from '../../../src/core/AudioSignal';
import BrokenAudioSignal from '../../../src/core/BrokenAudioSignal';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 vibrato + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const vibrato = new Vibrato();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  oscillator.plug([null, null, null, null]);
  vibrato.plug([oscillator, null, null, null]);
  speaker.plug([vibrato, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(vibrato.node));

  spy.mockRestore();
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

test('1 oscillator + 1 vibrato + 1 speaker - snatch vibrato disconnects speaker', async () => {
  const oscillator = new TestOscillator();
  const vibrato = new Vibrato();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  vibrato.plug([oscillator, null, null, null]);
  speaker.plug([vibrato, null, null, null]);

  const nodeBeforeSnatch = vibrato.node;
  vibrato.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new BrokenAudioSignal(nodeBeforeSnatch));

  await Promise.resolve(); // flush queueMicrotask to trigger deferred dispose
  expect(nodeBeforeSnatch?.dispose).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

test('1 oscillator + 1 vibrato + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const vibrato = new Vibrato();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  vibrato.plug([oscillator, null, null, null]);
  speaker.plug([vibrato, null, null, null]);

  expect(() => { oscillator.snatch(); }).not.toThrow();

  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

