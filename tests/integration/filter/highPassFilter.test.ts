import Speaker from '../../../src/output/Speaker';
import HighPassFilter from '../../../src/filter/HighPassFilter';
import AudioSignal from '../../../src/core/AudioSignal';
import BrokenAudioSignal from '../../../src/core/BrokenAudioSignal';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 high-pass filter + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const filter = new HighPassFilter();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  oscillator.plug([null, null, null, null]);
  filter.plug([oscillator, null, null, null]);
  speaker.plug([filter, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(filter.node));

  spy.mockRestore();
});

test('1 oscillator + 1 high-pass filter + 1 speaker - snatch filter does not throw', () => {
  const oscillator = new TestOscillator();
  const filter = new HighPassFilter();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  filter.plug([oscillator, null, null, null]);
  speaker.plug([filter, null, null, null]);

  expect(() => { filter.snatch(); }).not.toThrow();
});

test('1 oscillator + 1 high-pass filter + 1 speaker - snatch filter disconnects speaker', async () => {
  const oscillator = new TestOscillator();
  const filter = new HighPassFilter();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  filter.plug([oscillator, null, null, null]);
  speaker.plug([filter, null, null, null]);

  const nodeBeforeSnatch = filter.node;
  filter.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new BrokenAudioSignal(nodeBeforeSnatch));

  await Promise.resolve(); // flush queueMicrotask to trigger deferred dispose
  expect(nodeBeforeSnatch?.dispose).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

test('1 oscillator + 1 high-pass filter + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const filter = new HighPassFilter();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  filter.plug([oscillator, null, null, null]);
  speaker.plug([filter, null, null, null]);

  expect(() => { oscillator.snatch(); }).not.toThrow();

  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});
