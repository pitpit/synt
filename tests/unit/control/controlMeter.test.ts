import { expect, test } from '@jest/globals';
import ControlMeter from '../../../src/control/ControlMeter';
import ControlSignal from '../../../src/core/ControlSignal';
import PlugPosition from '../../../src/core/PlugPosition';
import PlugType from '../../../src/core/PlugType';

test('passes ControlSignal from EAST input through to WEST output', () => {
  const meter = new ControlMeter();
  const signal = new ControlSignal(0.75);

  const outputs = meter.onSignalChanged([null, signal, null, null]);

  expect(outputs[PlugPosition.WEST]).toBe(signal);
});

test('returns all-null when EAST input is not a ControlSignal', () => {
  const meter = new ControlMeter();

  const outputs = meter.onSignalChanged([null, null, null, null]);

  expect(outputs).toEqual([null, null, null, null]);
});

test('has CTRLIN on EAST and CTRLOUT on WEST', () => {
  const meter = new ControlMeter();

  expect(meter.plugs.getPlug(PlugPosition.EAST).type).toBe(PlugType.CTRLIN);
  expect(meter.plugs.getPlug(PlugPosition.WEST).type).toBe(PlugType.CTRLOUT);
});
