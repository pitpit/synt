import Speaker from '../../../src/output/Speaker';
import Reverb from '../../../src/effect/Reverb';
import ControlSignal from '../../../src/core/ControlSignal';
import PlugPosition from '../../../src/core/PlugPosition';
import Knob from '../../../src/control/Knob';
import TestOscillator from '../oscillator/TestOscillator';

test('1 oscillator + 1 reverb + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const reverb = new Reverb();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  reverb.plug([oscillator, null, null, null]);
  speaker.plug([reverb, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(reverb.node);
  expect(reverb.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
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

test('1 oscillator + 1 reverb + 1 speaker - snatch reverb disconnects', () => {
  const oscillator = new TestOscillator();
  const reverb = new Reverb();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  reverb.plug([oscillator, null, null, null]);
  speaker.plug([reverb, null, null, null]);

  const reverbNode = reverb.node;
  const speakerGain = speaker.audioInputNode;
  reverb.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(reverbNode);
  expect(reverbNode?.disconnect).toHaveBeenCalledWith(speakerGain);
  expect(reverbNode?.dispose).toHaveBeenCalledTimes(1);
});

test('1 oscillator + 1 reverb + 1 speaker - snatch oscillator does not throw', () => {
  const oscillator = new TestOscillator();
  const reverb = new Reverb();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  reverb.plug([oscillator, null, null, null]);
  speaker.plug([reverb, null, null, null]);

  const oscNode = oscillator.node;
  const reverbNode = reverb.node;

  expect(() => { oscillator.snatch(); }).not.toThrow();
  expect(oscNode?.disconnect).toHaveBeenCalledWith(reverbNode);
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

