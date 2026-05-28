import Knob from '../../../src/control/Knob';
import ControlSignal from '../../../src/core/ControlSignal';
import PlugPosition from '../../../src/core/PlugPosition';
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
  expect(oscillator.node?.frequency.value).toBe(200);

  spy.mockRestore();
});

test('new knob recalls previous control signal value on connect', () => {
  const oscillator = new TestOscillator();
  const firstKnob = new Knob();
  const secondKnob = new Knob();

  oscillator.plug([null, null, null, null]);
  firstKnob.plug([null, null, null, oscillator]);
  firstKnob.pushOutput(PlugPosition.WEST, new ControlSignal(0.8));

  secondKnob.plug([null, null, null, oscillator]);

  expect(secondKnob.value).toBeCloseTo(0.8);
  expect(secondKnob.pos).toBeCloseTo(secondKnob.range * (2 * 0.8 - 1));
  expect(oscillator.node?.frequency.value).toBeCloseTo(320);
});
