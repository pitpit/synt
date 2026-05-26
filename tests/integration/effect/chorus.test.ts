import Speaker from '../../../src/output/Speaker';
import Chorus from '../../../src/effect/Chorus';
import AudioSignal from '../../../src/core/AudioSignal';
import BrokenAudioSignal from '../../../src/core/BrokenAudioSignal';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 chorus + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const chorus = new Chorus();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  oscillator.plug([null, null, null, null]);
  chorus.plug([oscillator, null, null, null]);
  speaker.plug([chorus, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(chorus.node));

  spy.mockRestore();
});

test('1 oscillator + 1 chorus + 1 speaker - snatch chorus does not throw', () => {
  const oscillator = new TestOscillator();
  const chorus = new Chorus();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  chorus.plug([oscillator, null, null, null]);
  speaker.plug([chorus, null, null, null]);

  expect(() => { chorus.snatch(); }).not.toThrow();
});

test('1 oscillator + 1 chorus + 1 speaker - snatch chorus disconnects speaker', async () => {
  const oscillator = new TestOscillator();
  const chorus = new Chorus();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  chorus.plug([oscillator, null, null, null]);
  speaker.plug([chorus, null, null, null]);

  const nodeBeforeSnatch = chorus.node;
  chorus.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new BrokenAudioSignal(nodeBeforeSnatch));

  await Promise.resolve(); // flush queueMicrotask to trigger deferred dispose
  expect(nodeBeforeSnatch?.dispose).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

test('1 oscillator + 1 chorus + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const chorus = new Chorus();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  chorus.plug([oscillator, null, null, null]);
  speaker.plug([chorus, null, null, null]);

  expect(() => { oscillator.snatch(); }).not.toThrow();

  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});
