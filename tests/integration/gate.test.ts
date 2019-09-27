import Gate from '../../src/Gate';
import AudioSignal from '../../src/AudioSignal';
import BrokenAudioSignal from '../../src/BrokenAudioSignal';
import TestOscillator from './TestOscillator';

test('1 oscillator + 1 gate', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const spy = jest.spyOn(gate, 'onSignalChanged');

  oscillator.plug([null, null, null, null]);
  gate.plug([oscillator, null, null, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith([new AudioSignal(oscillator.node), null, null, null]);
  expect(spy).toHaveReturnedTimes(1);
  expect(spy).toHaveReturnedWith([null, null, new AudioSignal(oscillator.node), null]);

  spy.mockRestore();
});

test('1 gate + 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const spy = jest.spyOn(gate, 'onSignalChanged');

  gate.plug([null, null, null, null]);
  oscillator.plug([null, null, gate, null]);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith([new AudioSignal(oscillator.node), null, null, null]);
  expect(spy).toHaveReturnedTimes(1);
  expect(spy).toHaveReturnedWith([null, null, new AudioSignal(oscillator.node), null]);

  spy.mockRestore();
});

test('1 oscillator + 1 gate - 1 gate', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const spy = jest.spyOn(gate, 'onSignalChanged');

  oscillator.plug([null, null, null, null]);
  gate.plug([oscillator, null, null, null]);
  gate.snatch();

  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy).toHaveBeenLastCalledWith([new BrokenAudioSignal(oscillator.node), null, null, null]);

  spy.mockRestore();
});

test('1 oscillator + 1 gate - 1 oscillator', () => {
  const oscillator = new TestOscillator();
  const gate = new Gate();
  const spy = jest.spyOn(gate, 'onSignalChanged');

  oscillator.plug([null, null, null, null]);
  gate.plug([oscillator, null, null, null]);
  oscillator.snatch();

  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy).toHaveBeenLastCalledWith([new BrokenAudioSignal(oscillator.node), null, null, null]);

  spy.mockRestore();
});
