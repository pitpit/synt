import Konva from 'konva';
import { expect, test } from '@jest/globals';
import Knob from '../../../src/control/Knob';
import ControlMeter from '../../../src/control/ControlMeter';
import ControlSignal from '../../../src/core/ControlSignal';
import PlugPosition from '../../../src/core/PlugPosition';
import Speaker from '../../../src/output/Speaker';
import KnobMemory from '../../../src/core/KnobMemory';
import type Rack from '../../../src/core/Rack';

interface KonvaNodeWithListeners {
  eventListeners?: Record<string, unknown[]>;
}

interface KnobInternals {
  drawKnob: (group: Konva.Group) => void;
  interactionCircle: Konva.Circle | null;
}

function hasListener(node: Konva.Node | null, eventName: string): boolean {
  if (!node) return false;
  const listeners = (node as unknown as KonvaNodeWithListeners).eventListeners;
  return (listeners?.[eventName]?.length ?? 0) > 0;
}

function stubKnobVisual(knob: Knob): void {
  const internals = knob as unknown as KnobInternals;
  internals.drawKnob = (group: Konva.Group) => {
    internals.interactionCircle = new Konva.Circle({ x: 50, y: 50, radius: 24 });
    group.add(internals.interactionCircle);
  };
}

test('recalls previous control signal value on reconnect without animation runtime', () => {
  const speaker = new Speaker();
  const firstKnob = new Knob();
  const secondKnob = new Knob();
  const knobMemory = new KnobMemory();
  knobMemory.observe(speaker);
  firstKnob.knobMemory = knobMemory;
  secondKnob.knobMemory = knobMemory;

  speaker.plug([null, null, null, null]);
  firstKnob.plug([null, null, null, speaker]);
  firstKnob.pushOutput(PlugPosition.WEST, new ControlSignal(0.35));

  secondKnob.plug([null, null, null, speaker]);

  expect(secondKnob.value).toBeCloseTo(0.35);
  expect(secondKnob.pos).toBeCloseTo(secondKnob.range * (2 * 0.35 - 1));
});

test('keeps current value and pushes output when no recall is available', () => {
  const speaker = new Speaker();
  const knob = new Knob();

  speaker.plug([null, null, null, null]);
  knob.pushOutput(PlugPosition.WEST, new ControlSignal(0.9));

  knob.plug([null, null, null, speaker]);

  // Knob was at 0.5 (default); no recall available, so it keeps its current value
  expect(knob.value).toBeCloseTo(0.5);
  expect(knob.pos).toBeCloseTo(0);
  // Speaker should have received the Knob's current value immediately
  expect((speaker.getInputSignal(PlugPosition.EAST) as ControlSignal | null)?.value).toBeCloseTo(0.5);
});

test('does not attach interaction listeners when not attached to a rack', () => {
  const knob = new Knob();
  const group = new Konva.Group({ width: 100, height: 100 });
  stubKnobVisual(knob);

  knob.draw(group);

  const interactionCircle = (knob as unknown as { interactionCircle: Konva.Circle | null }).interactionCircle;
  expect(interactionCircle).not.toBeNull();
  expect(hasListener(interactionCircle, 'mousedown')).toBe(false);
  expect(hasListener(interactionCircle, 'touchstart')).toBe(false);
});

test('attaches interaction listeners when attached to a rack', () => {
  const knob = new Knob();
  const group = new Konva.Group({ width: 100, height: 100 });
  knob.rack = {} as unknown as Rack;
  stubKnobVisual(knob);

  knob.draw(group);

  const interactionCircle = (knob as unknown as { interactionCircle: Konva.Circle | null }).interactionCircle;
  expect(interactionCircle).not.toBeNull();
  expect(hasListener(interactionCircle, 'mousedown')).toBe(true);
  expect(hasListener(interactionCircle, 'touchstart')).toBe(true);
});

test('recalls AudioMod value after disconnect and reconnect of same knob', () => {
  const speaker = new Speaker();
  const knob = new Knob();
  const knobMemory = new KnobMemory();
  knobMemory.observe(speaker);
  knob.knobMemory = knobMemory;

  speaker.plug([null, null, null, null]);
  knob.plug([null, null, null, speaker]);
  knob.value = 0.35;
  knob.pushOutput(PlugPosition.WEST, new ControlSignal(0.35));

  // Disconnect, change knob value, then reconnect
  knob.unlink(PlugPosition.WEST);
  knob.value = 0.7;

  knob.plug([null, null, null, speaker]);

  // Should recall the value stored in speaker (0.35), not the knob's changed value (0.7)
  expect(knob.value).toBeCloseTo(0.35);
});

test('does not recall ControlMeter own input — keeps current value when no downstream AudioMod', () => {
  const meter = new ControlMeter();
  const firstKnob = new Knob();
  const secondKnob = new Knob();
  const knobMemory = new KnobMemory();
  knobMemory.observe(meter);
  firstKnob.knobMemory = knobMemory;
  secondKnob.knobMemory = knobMemory;

  // A prior Knob pushed a signal through the meter (stores in RecallStore)
  firstKnob.plug([null, null, null, meter]);
  firstKnob.pushOutput(PlugPosition.WEST, new ControlSignal(0.9));
  firstKnob.unlink(PlugPosition.WEST);

  // Second Knob connects; meter has no downstream mod so should not recall
  secondKnob.plug([null, null, null, meter]);

  // Knob should keep its default value (0.5), not recall 0.9 from meter's stored signal
  expect(secondKnob.value).toBeCloseTo(0.5);
});

test('does not recall through a chain of ControlMeters with no downstream AudioMod', () => {
  const meter1 = new ControlMeter();
  const meter2 = new ControlMeter();
  const firstKnob = new Knob();
  const secondKnob = new Knob();
  const knobMemory = new KnobMemory();
  knobMemory.observe(meter1);
  knobMemory.observe(meter2);
  firstKnob.knobMemory = knobMemory;
  secondKnob.knobMemory = knobMemory;

  // Chain: firstKnob → meter1 → meter2 (no AudioMod at the end)
  meter1.plug([null, null, null, meter2]);
  firstKnob.plug([null, null, null, meter1]);
  firstKnob.pushOutput(PlugPosition.WEST, new ControlSignal(0.9));
  firstKnob.unlink(PlugPosition.WEST);

  secondKnob.plug([null, null, null, meter1]);

  expect(secondKnob.value).toBeCloseTo(0.5);
});

test('recalls value through a chain of ControlMeters to an AudioMod', () => {
  const speaker = new Speaker();
  const meter1 = new ControlMeter();
  const meter2 = new ControlMeter();
  const firstKnob = new Knob();
  const secondKnob = new Knob();
  const knobMemory = new KnobMemory();
  knobMemory.observe(speaker);
  knobMemory.observe(meter1);
  knobMemory.observe(meter2);
  firstKnob.knobMemory = knobMemory;
  secondKnob.knobMemory = knobMemory;

  // Chain: firstKnob → meter1 → meter2 → speaker
  speaker.plug([null, null, null, null]);
  meter2.plug([null, null, null, speaker]);
  meter1.plug([null, null, null, meter2]);
  firstKnob.plug([null, null, null, meter1]);
  firstKnob.pushOutput(PlugPosition.WEST, new ControlSignal(0.65));
  firstKnob.unlink(PlugPosition.WEST);

  secondKnob.plug([null, null, null, meter1]);

  expect(secondKnob.value).toBeCloseTo(0.65);
});

test('recalls value via ControlMeter passthrough to AudioMod', () => {
  const speaker = new Speaker();
  const firstKnob = new Knob();
  const meter = new ControlMeter();
  const secondKnob = new Knob();
  const knobMemory = new KnobMemory();
  knobMemory.observe(speaker);
  knobMemory.observe(meter);
  firstKnob.knobMemory = knobMemory;
  secondKnob.knobMemory = knobMemory;

  speaker.plug([null, null, null, null]);
  meter.plug([null, null, null, speaker]);
  firstKnob.plug([null, null, null, meter]);
  firstKnob.pushOutput(PlugPosition.WEST, new ControlSignal(0.35));

  // Disconnect firstKnob, then connect secondKnob to meter
  firstKnob.unlink(PlugPosition.WEST);
  secondKnob.plug([null, null, null, meter]);

  // secondKnob should recall 0.35 (stored in speaker via the chain)
  expect(secondKnob.value).toBeCloseTo(0.35);
});

test('recalls value after both ControlMeter and Knob are fully unplugged and replugged', () => {
  const speaker = new Speaker();
  const meter = new ControlMeter();
  const knob = new Knob();
  const knobMemory = new KnobMemory();
  knobMemory.observe(speaker);
  knobMemory.observe(meter);
  knob.knobMemory = knobMemory;

  // Build chain: knob → meter → speaker
  speaker.plug([null, null, null, null]);
  meter.plug([null, null, null, speaker]);
  knob.plug([null, null, null, meter]);

  // Set value to 0.35
  knob.value = 0.35;
  knob.pushOutput(PlugPosition.WEST, new ControlSignal(0.35));

  // Unplug the Knob, change its value
  knob.unlink(PlugPosition.WEST);
  knob.value = 0.7;

  // Unplug the ControlMeter, then replug it to speaker
  meter.unlink(PlugPosition.WEST);
  meter.plug([null, null, null, speaker]);

  // Replug the Knob — should recall 0.35 (stored in speaker's recall store)
  knob.plug([null, null, null, meter]);

  expect(knob.value).toBeCloseTo(0.35);
});
