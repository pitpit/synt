import Speaker from '../../../src/output/Speaker';
import Flanger from '../../../src/effect/Flanger';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 flanger + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const flanger = new Flanger();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  flanger.plug([oscillator, null, null, null]);
  speaker.plug([flanger, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(flanger.node);
  expect(flanger.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
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

test('1 oscillator + 1 flanger + 1 speaker - snatch flanger disconnects', () => {
  const oscillator = new TestOscillator();
  const flanger = new Flanger();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  flanger.plug([oscillator, null, null, null]);
  speaker.plug([flanger, null, null, null]);

  const flangerNode = flanger.node;
  const speakerGain = speaker.audioInputNode;
  flanger.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(flangerNode);
  expect(flangerNode?.disconnect).toHaveBeenCalledWith(speakerGain);
  expect(flangerNode?.dispose).toHaveBeenCalledTimes(1);
});

test('1 oscillator + 1 flanger + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const flanger = new Flanger();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  flanger.plug([oscillator, null, null, null]);
  speaker.plug([flanger, null, null, null]);

  const oscNode = oscillator.node;
  const flangerNode = flanger.node;

  expect(() => { oscillator.snatch(); }).not.toThrow();
  expect(oscNode?.disconnect).toHaveBeenCalledWith(flangerNode);
});

