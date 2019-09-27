import Knob from '../../src/Knob';
import AudioSignal from '../../src/AudioSignal';
import ControlSignal from '../../src/ControlSignal';
import PlugPosition from '../../src/PlugPosition';
import TestOscillator from './TestOscillator';

test('1 oscillator + 1 knob', () => {
  const oscillator = new TestOscillator();
  const knob = new Knob();
  const spy = jest.spyOn(oscillator, 'onSignalChanged');

  oscillator.plug([null, null, null, null]);
  knob.plug([null, null, null, oscillator]);

  // Simulate change on wheel
  const controlSignal = new ControlSignal(0.5);
  knob.pushOutput(PlugPosition.WEST, controlSignal);

  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy).toHaveBeenLastCalledWith([null, controlSignal, null, null]);
  expect(spy).toHaveReturnedTimes(2);
  expect(spy).toHaveLastReturnedWith([null, null, new AudioSignal(oscillator.node), null]);
  expect(oscillator.node.frequency).toBe(200);

  spy.mockRestore();
});
