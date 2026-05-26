import Speaker from '../../../src/output/Speaker';
import Phaser from '../../../src/effect/Phaser';
import AudioSignal from '../../../src/core/AudioSignal';
import BrokenAudioSignal from '../../../src/core/BrokenAudioSignal';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 phaser + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const phaser = new Phaser();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  oscillator.plug([null, null, null, null]);
  phaser.plug([oscillator, null, null, null]);
  speaker.plug([phaser, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(phaser.node));

  spy.mockRestore();
});

test('1 oscillator + 1 phaser + 1 speaker - snatch phaser does not throw', () => {
  const oscillator = new TestOscillator();
  const phaser = new Phaser();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  phaser.plug([oscillator, null, null, null]);
  speaker.plug([phaser, null, null, null]);

  expect(() => { phaser.snatch(); }).not.toThrow();
});

test('1 oscillator + 1 phaser + 1 speaker - snatch phaser disconnects speaker', async () => {
  const oscillator = new TestOscillator();
  const phaser = new Phaser();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  phaser.plug([oscillator, null, null, null]);
  speaker.plug([phaser, null, null, null]);

  const nodeBeforeSnatch = phaser.node;
  phaser.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new BrokenAudioSignal(nodeBeforeSnatch));

  await Promise.resolve(); // flush queueMicrotask to trigger deferred dispose
  expect(nodeBeforeSnatch?.dispose).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

test('1 oscillator + 1 phaser + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const phaser = new Phaser();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  phaser.plug([oscillator, null, null, null]);
  speaker.plug([phaser, null, null, null]);

  expect(() => { oscillator.snatch(); }).not.toThrow();

  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});
