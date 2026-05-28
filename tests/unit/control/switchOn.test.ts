import Konva from 'konva';
import { expect, test } from '@jest/globals';
import SwitchOn from '../../../src/control/SwitchOn';
import type Rack from '../../../src/core/Rack';

interface KonvaNodeWithListeners {
  eventListeners?: Record<string, unknown[]>;
}

function hasListener(node: Konva.Node | null, eventName: string): boolean {
  if (!node) return false;
  const listeners = (node as unknown as KonvaNodeWithListeners).eventListeners;
  return (listeners?.[eventName]?.length ?? 0) > 0;
}

test('draws a full-size interaction rect over the switch frame', () => {
  const switchOn = new SwitchOn();
  const group = new Konva.Group({ width: 120, height: 120 });

  switchOn.draw(group);

  const outerRect = group.findOne('.switch-on-outer') as Konva.Rect | null;
  const interactionRect = group.findOne('.switch-on-interaction') as Konva.Rect | null;

  expect(outerRect).not.toBeNull();
  expect(interactionRect).not.toBeNull();
  expect(interactionRect?.x()).toBe(30);
  expect(interactionRect?.y()).toBe(30);
  expect(interactionRect?.width()).toBe(outerRect?.width());
  expect(interactionRect?.height()).toBe(outerRect?.height());
});

test('does not attach interaction listeners when not attached to a rack', () => {
  const switchOn = new SwitchOn();
  const group = new Konva.Group({ width: 120, height: 120 });

  switchOn.draw(group);

  const interactionRect = group.findOne('.switch-on-interaction') as Konva.Rect | null;
  expect(interactionRect).not.toBeNull();
  expect(hasListener(interactionRect, 'mousedown')).toBe(false);
  expect(hasListener(interactionRect, 'touchstart')).toBe(false);
});

test('attaches interaction listeners when attached to a rack', () => {
  const switchOn = new SwitchOn();
  const group = new Konva.Group({ width: 120, height: 120 });
  switchOn.rack = {} as unknown as Rack;

  switchOn.draw(group);

  const interactionRect = group.findOne('.switch-on-interaction') as Konva.Rect | null;
  expect(interactionRect).not.toBeNull();
  expect(hasListener(interactionRect, 'mousedown')).toBe(true);
  expect(hasListener(interactionRect, 'touchstart')).toBe(true);
});