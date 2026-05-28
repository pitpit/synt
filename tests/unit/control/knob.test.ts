import Konva from 'konva';
import { expect, test } from '@jest/globals';
import Knob from '../../../src/control/Knob';
import ControlSignal from '../../../src/core/ControlSignal';
import PlugPosition from '../../../src/core/PlugPosition';
import Speaker from '../../../src/output/Speaker';
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

  speaker.plug([null, null, null, null]);
  firstKnob.plug([null, null, null, speaker]);
  firstKnob.pushOutput(PlugPosition.WEST, new ControlSignal(0.35));

  secondKnob.plug([null, null, null, speaker]);

  expect(secondKnob.value).toBeCloseTo(0.35);
  expect(secondKnob.pos).toBeCloseTo(secondKnob.range * (2 * 0.35 - 1));
});

test('centers knob on connect when previous control value is unknown', () => {
  const speaker = new Speaker();
  const knob = new Knob();

  speaker.plug([null, null, null, null]);
  knob.pushOutput(PlugPosition.WEST, new ControlSignal(0.9));

  knob.plug([null, null, null, speaker]);

  expect(knob.value).toBeCloseTo(0.5);
  expect(knob.pos).toBeCloseTo(0);
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
