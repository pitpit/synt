import Speaker from '../../../src/output/Speaker';
import ControlSignal from '../../../src/core/ControlSignal';
import PlugPosition from '../../../src/core/PlugPosition';
import TestOscillator from '../oscillator/TestOscillator';
import Gate from '../../../src/control/Gate';
import Knob from '../../../src/control/Knob';

test('1 oscillator + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('1 speaker + 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();

  speaker.plug([null, null, null, null]);
  oscillator.plug([null, null, speaker, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('1 oscillator + 1 speaker - 1 speaker', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);

  const speakerGain = speaker.audioInputNode;
  speaker.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(speakerGain);
  expect(speakerGain.dispose).toHaveBeenCalledTimes(1);
});

test('1 oscillator + 1 speaker - 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);

  const oscNode = oscillator.node;
  const speakerGain = speaker.audioInputNode;
  oscillator.snatch();

  expect(oscNode?.disconnect).toHaveBeenCalledWith(speakerGain);
});

test('1 oscillator + 1 gate + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  gate.plug([oscillator, null, null, null]);
  speaker.plug([gate, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(gate.audioInputNode);
  expect(gate.audioOutputNode.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('1 oscillator + 1 speaker + 1 gate', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  speaker.plug([gate, null, null, null]);
  gate.plug([oscillator, null, speaker, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(gate.audioInputNode);
  expect(gate.audioOutputNode.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('1 speaker + 1 gate + 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(gate.audioInputNode);
  expect(gate.audioOutputNode.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('1 speaker + 1 gate + 1 oscillator - 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);

  const oscNode = oscillator.node;
  const gateNode = gate.audioInputNode;
  oscillator.snatch();

  expect(oscNode?.disconnect).toHaveBeenCalledWith(gateNode);
});

test('1 speaker + 1 gate + 1 oscillator - 1 gate', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);

  const gateNode = gate.audioInputNode;
  const speakerGain = speaker.audioInputNode;
  gate.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(gateNode);
  expect(gateNode.disconnect).toHaveBeenCalledWith(speakerGain);
  expect(gateNode.dispose).toHaveBeenCalledTimes(1);
});

test('1 speaker + 1 gate + 1 oscillator - 1 speaker', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);

  const gateNode = gate.audioInputNode;
  const speakerGain = speaker.audioInputNode;
  speaker.snatch();

  expect(gateNode.disconnect).toHaveBeenCalledWith(speakerGain);
  expect(speakerGain.dispose).toHaveBeenCalledTimes(1);
});

test('1 oscillator + 1 speaker + 1 knob', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const knob = new Knob();
  const spy = jest.spyOn(speaker, 'onSignalChanged');

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);
  knob.plug([null, null, null, speaker]);

  const controlSignal = new ControlSignal(0.5);
  knob.pushOutput(PlugPosition.WEST, controlSignal);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenLastCalledWith([null, controlSignal, null, null]);

  spy.mockRestore();
});

test('1 oscillator + 1 speaker  + 1 knob - 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const knob = new Knob();

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);
  knob.plug([null, null, null, speaker]);

  const controlSignal = new ControlSignal(0.5);
  knob.pushOutput(PlugPosition.WEST, controlSignal);

  const oscNode = oscillator.node;
  const speakerGain = speaker.audioInputNode;
  oscillator.snatch();

  expect(oscNode?.disconnect).toHaveBeenCalledWith(speakerGain);
});

test('1 oscillator + 1 speaker  + 1 knob - 1 speaker', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const knob = new Knob();

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);
  knob.plug([null, null, null, speaker]);

  const controlSignal = new ControlSignal(0.5);
  knob.pushOutput(PlugPosition.WEST, controlSignal);

  const speakerGain = speaker.audioInputNode;
  speaker.snatch();

  expect(oscillator.node?.disconnect).toHaveBeenCalledWith(speakerGain);
  expect(speakerGain.dispose).toHaveBeenCalledTimes(1);
});

test('new knob recalls previous control signal value on speaker connect', () => {
  const speaker = new Speaker();
  const firstKnob = new Knob();
  const secondKnob = new Knob();

  speaker.plug([null, null, null, null]);
  firstKnob.plug([null, null, null, speaker]);
  firstKnob.pushOutput(PlugPosition.WEST, new ControlSignal(0.7));

  secondKnob.plug([null, null, null, speaker]);

  expect(secondKnob.value).toBeCloseTo(0.7);
  expect(secondKnob.pos).toBeCloseTo(secondKnob.range * (2 * 0.7 - 1));
});
