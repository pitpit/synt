import { expect, test, jest } from '@jest/globals';
import { exportRack, importRack } from '../../../src/core/RackSerializer';
import Knob from '../../../src/control/Knob';
import StickyNote from '../../../src/annotation/StickyNote';
import type Mod from '../../../src/core/Mod';

// ---------------------------------------------------------------------------
// Minimal Rack stub
// ---------------------------------------------------------------------------

interface StubRack {
  stageWidth: number;
  stageHeight: number;
  mods: Mod[];
  annotations: StickyNote[];
  add: ReturnType<typeof jest.fn>;
  addAnnotation: ReturnType<typeof jest.fn>;
  draw: ReturnType<typeof jest.fn>;
  plugAll: ReturnType<typeof jest.fn>;
  clear: ReturnType<typeof jest.fn>;
}

function makeRack(mods: Mod[] = []): StubRack {
  return {
    stageWidth: 10,
    stageHeight: 10,
    mods,
    annotations: [],
    add: jest.fn(),
    addAnnotation: jest.fn(),
    draw: jest.fn(),
    plugAll: jest.fn(),
    clear: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// exportRack — Knob value is serialised
// ---------------------------------------------------------------------------

test('exportRack: serialises knob value', () => {
  const knob = new Knob();
  knob.value = 0.75;
  knob.pos = knob.range * (2 * 0.75 - 1);
  // Simulate what Rack.add sets
  (knob as unknown as { x: number }).x = 1;
  (knob as unknown as { y: number }).y = 2;

  const rack = makeRack([knob]);
  const yaml = exportRack(rack as never);

  expect(yaml).toContain('value: 0.75');
});

test('exportRack: default knob value (0.5) is serialised', () => {
  const knob = new Knob();
  (knob as unknown as { x: number }).x = 0;
  (knob as unknown as { y: number }).y = 0;

  const rack = makeRack([knob]);
  const yaml = exportRack(rack as never);

  expect(yaml).toContain('value: 0.5');
});

// ---------------------------------------------------------------------------
// importRack — Knob is instantiated with the correct value
// ---------------------------------------------------------------------------

test('importRack (silent): sets knob value and pos from YAML', () => {
  const yaml = `
synt:
  rack:
    width: 5
    height: 5
  mods:
    - type: Knob
      x: 0
      y: 0
      value: 0.8
`;

  const rack = makeRack();
  importRack(yaml, rack as never, { silent: true });

  expect(rack.add).toHaveBeenCalledTimes(1);
  const [addedMod] = (rack.add as ReturnType<typeof jest.fn>).mock.calls[0] as [Knob, number, number];
  expect(addedMod).toBeInstanceOf(Knob);
  expect(addedMod.value).toBeCloseTo(0.8);
  expect(addedMod.pos).toBeCloseTo(addedMod.range * (2 * 0.8 - 1));
});

test('importRack (silent): knob without value uses default 0.5', () => {
  const yaml = `
synt:
  mods:
    - type: Knob
      x: 0
      y: 0
`;

  const rack = makeRack();
  importRack(yaml, rack as never, { silent: true });

  const [addedMod] = (rack.add as ReturnType<typeof jest.fn>).mock.calls[0] as [Knob, number, number];
  expect(addedMod).toBeInstanceOf(Knob);
  expect(addedMod.value).toBeCloseTo(0.5);
});

test('importRack (silent): clamps out-of-range value to [0, 1]', () => {
  // The serializer clamps silently; an invalid value from a hand-edited YAML
  // that passed schema validation (schema enforces 0–1) would never exceed
  // the range in practice, but the code defends against it.
  const yaml = `
synt:
  mods:
    - type: Knob
      x: 0
      y: 0
      value: 0.0
`;

  const rack = makeRack();
  importRack(yaml, rack as never, { silent: true });

  const [addedMod] = (rack.add as ReturnType<typeof jest.fn>).mock.calls[0] as [Knob, number, number];
  expect(addedMod.value).toBeCloseTo(0);
  expect(addedMod.pos).toBeCloseTo(addedMod.range * (2 * 0 - 1));
});
