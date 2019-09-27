import Speaker from '../../src/Speaker';
import AudioSignal from '../../src/AudioSignal';
import BrokenAudioSignal from '../../src/BrokenAudioSignal';
import TestOscillator from './TestOscillator';
import Gate from '../../src/Gate';
import Knob from '../../src/Knob';
import ControlSignal from '../../src/ControlSignal';
import PlugPosition from '../../src/PlugPosition';

test('1 oscillator + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 speaker + 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  speaker.plug([null, null, null, null]);
  oscillator.plug([null, null, speaker, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 oscillator + 1 speaker - 1 speaker', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);
  speaker.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenLastCalledWith(new BrokenAudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 oscillator + 1 speaker - 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);
  oscillator.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenLastCalledWith(new BrokenAudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 oscillator + 1 gate + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  oscillator.plug([null, null, null, null]);
  gate.plug([oscillator, null, null, null]);
  speaker.plug([gate, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(oscillator.node));

  spy.mockRestore();
});


test('1 oscillator + 1 speaker + 1 gate', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  oscillator.plug([null, null, null, null]);
  speaker.plug([gate, null, null, null]);
  gate.plug([oscillator, null, speaker, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 speaker + 1 gate + 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'connect');

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(new AudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 speaker + 1 gate + 1 oscillator - 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);
  oscillator.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenLastCalledWith(new BrokenAudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 speaker + 1 gate + 1 oscillator - 1 gate', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);
  gate.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenLastCalledWith(new BrokenAudioSignal(oscillator.node));

  spy.mockRestore();
});

test('1 speaker + 1 gate + 1 oscillator - 1 speaker', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const speaker = new Speaker();
  const spy = jest.spyOn(speaker, 'disconnect');

  speaker.plug([null, null, null, null]);
  gate.plug([null, null, speaker, null]);
  oscillator.plug([null, null, gate, null]);
  speaker.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenLastCalledWith(new BrokenAudioSignal(oscillator.node));

  spy.mockRestore();
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

  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy).toHaveBeenLastCalledWith([null, controlSignal, null, null]);

  spy.mockRestore();
});

test('1 oscillator + 1 speaker  + 1 knob - 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const knob = new Knob();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);
  knob.plug([null, null, null, speaker]);

  const controlSignal = new ControlSignal(0.5);
  knob.pushOutput(PlugPosition.WEST, controlSignal);

  oscillator.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenLastCalledWith(new BrokenAudioSignal(oscillator.node));

  spy.mockRestore();
});


test('1 oscillator + 1 speaker  + 1 knob - 1 speaker', () => {
  const oscillator = new TestOscillator();
  const speaker = new Speaker();
  const knob = new Knob();
  const spy = jest.spyOn(speaker, 'disconnect');

  oscillator.plug([null, null, null, null]);
  speaker.plug([oscillator, null, null, null]);
  knob.plug([null, null, null, speaker]);

  const controlSignal = new ControlSignal(0.5);
  knob.pushOutput(PlugPosition.WEST, controlSignal);

  speaker.snatch();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenLastCalledWith(new BrokenAudioSignal(oscillator.node));

  spy.mockRestore();
});
