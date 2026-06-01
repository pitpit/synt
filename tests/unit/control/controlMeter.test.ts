import { expect, test } from '@jest/globals';
import ControlMeter from '../../../src/control/ControlMeter';
import ControlSignal from '../../../src/core/ControlSignal';
import Knob from '../../../src/control/Knob';
import PlugPosition from '../../../src/core/PlugPosition';
import PlugType from '../../../src/core/PlugType';
import Speaker from '../../../src/output/Speaker';
import KnobMemory from '../../../src/core/KnobMemory';

function stubDisplay(meter: ControlMeter): { getText(): string } {
  let value = '0.000';
  const mock = {
    text(v?: string): string | undefined {
      if (v !== undefined) { value = v; return undefined; }
      return value;
    },
    getLayer: () => null,
  };
  (meter as unknown as { displayText: object }).displayText = mock;
  return { getText: () => value };
}

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

test('resets display to 0.000 when EAST plug is disconnected', () => {
  const meter = new ControlMeter();
  const display = stubDisplay(meter);

  meter.onSignalChanged([null, new ControlSignal(0.75), null, null]);
  expect(display.getText()).toBe('0.750');

  (meter as unknown as { onUnlinked: (p: number, prev: object) => void }).onUnlinked(PlugPosition.EAST, {});
  expect(display.getText()).toBe('0.000');
});

test('recall returns null when no downstream mod on WEST', () => {
  const meter = new ControlMeter();
  const knobMemory = new KnobMemory();
  knobMemory.observe(meter);

  expect(knobMemory.get(meter, PlugPosition.EAST)).toBeNull();
});

test('recall returns downstream mod input signal', () => {
  const meter = new ControlMeter();
  const speaker = new Speaker();
  const knobMemory = new KnobMemory();
  knobMemory.observe(speaker);

  speaker.plug([null, null, null, null]);
  meter.plug([null, null, null, speaker]);
  speaker.pushInput(PlugPosition.EAST, new ControlSignal(0.42));

  const recalled = knobMemory.get(meter, PlugPosition.EAST);

  expect(recalled).toBeInstanceOf(ControlSignal);
  expect((recalled as ControlSignal).value).toBeCloseTo(0.42);
});

test('display re-updates after knob disconnect and reconnect at same value', () => {
  const meter = new ControlMeter();
  const knob = new Knob();
  const display = stubDisplay(meter);

  // Connect: knob.group is null so animateToValue pushes immediately (value=0.5, no recall)
  knob.plug([null, null, null, meter]);
  expect(display.getText()).toBe('0.500');

  // Simulate knob being dragged to 0.35
  knob.value = 0.35;
  knob.pushOutput(PlugPosition.WEST, new ControlSignal(0.35));
  expect(display.getText()).toBe('0.350');

  // Disconnect: display resets; inputSignals[EAST] is cleared by Mod.unlink()
  knob.unlink(PlugPosition.WEST);
  expect(display.getText()).toBe('0.000');

  // Reconnect: onLinked fires, no downstream recall, pushes current knob.value (0.35)
  knob.plug([null, null, null, meter]);
  expect(display.getText()).toBe('0.350');
});

test('ControlMeter plugged to Knob (not Knob to ControlMeter) shows current Knob value', () => {
  const knob = new Knob();
  const meter = new ControlMeter();
  const display = stubDisplay(meter);

  knob.value = 0.58;

  // ControlMeter's plug() is called (as if CM was dropped next to the Knob)
  meter.plug([null, knob, null, null]);

  expect(display.getText()).toBe('0.580');
});

test('second ControlMeter connected downstream of first immediately shows current value', () => {
  const knob = new Knob();
  const meter1 = new ControlMeter();
  const meter2 = new ControlMeter();
  const display1 = stubDisplay(meter1);
  const display2 = stubDisplay(meter2);

  // knob → meter2 (knob.WEST → meter2.EAST), then meter2 → meter1 (meter2.WEST → meter1.EAST)
  knob.plug([null, null, null, meter2]);
  // Set knob to 0.58
  knob.value = 0.58;
  knob.pushOutput(PlugPosition.WEST, new ControlSignal(0.58));
  expect(display2.getText()).toBe('0.580');

  // Now connect meter1 downstream of meter2
  meter2.plug([null, null, null, meter1]);

  // meter1 should immediately show 0.580 from the replay
  expect(display1.getText()).toBe('0.580');
});

test('disconnecting knob resets all ControlMeters in a chain', () => {
  const knob = new Knob();
  const meter1 = new ControlMeter();
  const meter2 = new ControlMeter();
  const meter3 = new ControlMeter();
  const display1 = stubDisplay(meter1);
  const display2 = stubDisplay(meter2);
  const display3 = stubDisplay(meter3);

  // Build chain: knob → meter1 → meter2 → meter3
  meter3.plug([null, null, null, null]);
  meter2.plug([null, null, null, meter3]);
  meter1.plug([null, null, null, meter2]);
  knob.plug([null, null, null, meter1]);

  knob.value = 0.58;
  knob.pushOutput(PlugPosition.WEST, new ControlSignal(0.58));
  expect(display1.getText()).toBe('0.580');
  expect(display2.getText()).toBe('0.580');
  expect(display3.getText()).toBe('0.580');

  // Disconnect knob — all meters should reset
  knob.unlink(PlugPosition.WEST);
  expect(display1.getText()).toBe('0.000');
  expect(display2.getText()).toBe('0.000');
  expect(display3.getText()).toBe('0.000');
});

test('connecting ControlMeter to an AudioMod without a live source does not change AudioMod value', () => {
  const meter = new ControlMeter();
  const speaker = new Speaker();
  const knobMemory = new KnobMemory();
  knobMemory.observe(speaker);

  // Seed a signal through the meter (simulates prior Knob use)
  meter.onSignalChanged([null, new ControlSignal(0.58), null, null]);

  // Speaker has its own stored value from before
  speaker.plug([null, null, null, null]);
  speaker.pushInput(PlugPosition.EAST, new ControlSignal(0.3));

  // Now connect meter to speaker with NO Knob attached to meter
  meter.plug([null, null, null, speaker]);

  // Speaker's recall value must NOT have been overwritten by meter's stale output
  expect((knobMemory.get(speaker, PlugPosition.EAST) as ControlSignal | null)?.value).toBeCloseTo(0.3);
});
