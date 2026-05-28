import Speaker from '../../../src/output/Speaker';
import Chorus from '../../../src/effect/Chorus';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 chorus + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const chorus = new Chorus();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  chorus.plug([oscillator, null, null, null]);
  speaker.plug([chorus, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(chorus.node);
  expect(chorus.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
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

test('1 oscillator + 1 chorus + 1 speaker - snatch chorus disconnects', () => {
  const oscillator = new TestOscillator();
  const chorus = new Chorus();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  chorus.plug([oscillator, null, null, null]);
  speaker.plug([chorus, null, null, null]);

  const chorusNode = chorus.node;
  const speakerGain = speaker.audioInputNode;
  chorus.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(chorusNode);
  expect(chorusNode?.disconnect).toHaveBeenCalledWith(speakerGain);
  expect(chorusNode?.dispose).toHaveBeenCalledTimes(1);
});

test('1 oscillator + 1 chorus + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const chorus = new Chorus();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  chorus.plug([oscillator, null, null, null]);
  speaker.plug([chorus, null, null, null]);

  const oscNode = oscillator.node;
  const chorusNode = chorus.node;

  expect(() => { oscillator.snatch(); }).not.toThrow();
  expect(oscNode?.disconnect).toHaveBeenCalledWith(chorusNode);
});

