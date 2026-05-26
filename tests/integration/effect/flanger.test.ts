import Speaker from '../../../src/output/Speaker';
import Flanger from '../../../src/effect/Flanger';
import AudioSignal from '../../../src/core/AudioSignal';
import BrokenAudioSignal from '../../../src/core/BrokenAudioSignal';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 flanger + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const flanger = new Flanger();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  oscillator.plug([null, null, null, null]);
  flanger.plug([oscillator, null, null, null]);
  speaker.plug([flanger, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(flanger.node));

  spy.mockRestore();
});

test('1 oscillator + 1 flanger + 1 speaker - snatch flanger does not throw', () => {
  const oscillator = new TestOscillator();
  const flanger = new Flanger();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  flanger.plug([oscillator, null, null, null]);
  speaker.plug([flanger, null, null, null]);

  expect(() => { flanger.snatch(); }).not.toThrow();
});

test('1 oscillator + 1 flanger + 1 speaker - snatch flanger disconnects speaker', async () => {
  const oscillator = new TestOscillator();
  const flanger = new Flanger();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  flanger.plug([oscillator, null, null, null]);
  speaker.plug([flanger, null, null, null]);

  const nodeBeforeSnatch = flanger.node;
  flanger.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new BrokenAudioSignal(nodeBeforeSnatch));

  await Promise.resolve(); // flush queueMicrotask to trigger deferred dispose
  expect(nodeBeforeSnatch?.dispose).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

test('1 oscillator + 1 flanger + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const flanger = new Flanger();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  flanger.plug([oscillator, null, null, null]);
  speaker.plug([flanger, null, null, null]);

  expect(() => { oscillator.snatch(); }).not.toThrow();

  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});
