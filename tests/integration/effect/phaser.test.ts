import Speaker from '../../../src/output/Speaker';
import Phaser from '../../../src/effect/Phaser';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 phaser + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const phaser = new Phaser();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  phaser.plug([oscillator, null, null, null]);
  speaker.plug([phaser, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(phaser.node);
  expect(phaser.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
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

test('1 oscillator + 1 phaser + 1 speaker - snatch phaser disconnects', () => {
  const oscillator = new TestOscillator();
  const phaser = new Phaser();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  phaser.plug([oscillator, null, null, null]);
  speaker.plug([phaser, null, null, null]);

  const phaserNode = phaser.node;
  const speakerGain = speaker.audioInputNode;
  phaser.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(phaserNode);
  expect(phaserNode?.disconnect).toHaveBeenCalledWith(speakerGain);
  expect(phaserNode?.dispose).toHaveBeenCalledTimes(1);
});

test('1 oscillator + 1 phaser + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const phaser = new Phaser();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  phaser.plug([oscillator, null, null, null]);
  speaker.plug([phaser, null, null, null]);

  const oscNode = oscillator.node;
  const phaserNode = phaser.node;

  expect(() => { oscillator.snatch(); }).not.toThrow();
  expect(oscNode?.disconnect).toHaveBeenCalledWith(phaserNode);
});

