# Writing an Audio Module

This guide walks you through implementing a new audio module. For background on the architecture see [01-architecture.md](01-architecture.md).

Choose the base class that matches your module's role:

| Base class | Use for |
|------------|---------|
| `SourceMod` | Audio generators (oscillators, noise sources) |
| `EffectMod` | Audio processors (effects, filters, gates) |
| `SinkMod` | Audio sinks (speaker output) |

Control-only modules (e.g. `Knob`) extend `Mod` directly.

---

## Source modules (`SourceMod`)

Extend `SourceMod` for modules that **produce** audio with no audio input.

```ts
import { Oscillator as ToneOscillator } from 'tone';
import type { ToneAudioNode } from 'tone';
import SourceMod from '../core/SourceMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class MySineOscillator extends SourceMod {
  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');
  }

  protected createOutputNode(): ToneAudioNode {
    return new ToneOscillator({ frequency: 220, type: 'sine' }).start();
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      (this.outputNode as ToneOscillator).frequency.value = value * 400;
    }
  }
}
```

`SourceMod` calls `createOutputNode()` lazily the first time the module is linked downstream. When a `ControlSignal` arrives on any plug, `mapControl` is called automatically with the plug position and value in `[0, 1]`.

`SourceMod` does not provide a `get node()` helper. If you maintain an abstract family (like `Oscillator`) and need a strongly typed node getter for subclasses/tests, add it in that family class.

---

## Effect modules (`EffectMod`)

Extend `EffectMod` for modules that **process** audio — they have both an audio input and an audio output.

```ts
import { Tremolo as ToneTremolo } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class MyTremolo extends EffectMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'tremolo');
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneTremolo(8, 1).start();
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      (this.effectNode as ToneTremolo).frequency.value = value * 10;
    }
  }
}
```

`EffectMod` calls `createEffectNode()` lazily when first linked. The single effect node serves as both `audioInputNode` and `audioOutputNode`. Tone.js node wiring is handled automatically by the base class lifecycle hooks (`onLinked`, `onUnlinked`, `onSnatched`).

The `get node()` getter (returns `ToneAudioNode | null`) is provided by `EffectMod` — **do not redeclare it**. Cast to the specific type inside `mapControl`:

```ts
(this.effectNode as ToneTremolo).frequency.value = value * 10;
```

---

## `configure()` in depth

```ts
this.configure(plugTypes, label?, width?, height?)
```

`plugTypes` is an array indexed by `PlugPosition`:

| Index | Position | Typical role |
|-------|----------|--------------|
| `0` | NORTH | Audio or control **input** |
| `1` | EAST | **Control** input |
| `2` | SOUTH | Audio or control **output** |
| `3` | WEST | Rarely used — second control input |

Trailing `PlugType.NULL` entries can be omitted. `label` is the text shown on the module tile. `width` and `height` are the number of grid slots the module occupies (default: 1 × 1).

```ts
// Source — no audio input, control on EAST, audio out on SOUTH
this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');

// Effect — audio in on NORTH, control on EAST, audio out on SOUTH
this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'tremolo');

// Effect with two CV inputs (EAST + WEST)
// [NORTH: IN, EAST: CTRLIN, SOUTH: OUT, WEST: CTRLIN]
this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT, PlugType.CTRLIN], 'reverb');

// Sink — audio in and control in, no output, 2-slot wide
this.configure([PlugType.IN, PlugType.CTRLIN], 'speaker', 2);
```

---

## CV Mapping Conventions

Scale `ControlSignal.value` (always `[0, 1]`) to the Tone.js parameter range inside `mapControl`:

| Parameter | Typical mapping |
|-----------|----------------|
| Oscillator pitch (Hz) | `value * 400` |
| Effect rate / modulation (Hz) | `value * 10` |
| Filter cutoff (Hz) | `value * 4000` |
| Panning | `(value * 2) - 1` → `-1` (left) to `+1` (right) |
| Gain / amplitude | `value` (0–1 linear) |
| Reverb decay (s) | `value * 10` |

---

## Event-driven modules (`pushOutput`)

If your module emits control signals in response to user interactions — rather than upstream signal changes — call `pushOutput()` directly from a `draw()` event handler:

```ts
draw(group: Konva.Group) {
  group.on('mousedown', () => {
    this.pushOutput(PlugPosition.WEST, new ControlSignal(1));
  });
  group.on('mouseup', () => {
    this.pushOutput(PlugPosition.WEST, new ControlSignal(0));
  });
}
```

---

## `draw()` override

`Mod.init()` automatically renders a white labelled rectangle with plug indicators. Override `draw()` only when you need custom visuals inside that rectangle.

```ts
draw(group: Konva.Group) {
  // group is a Konva.Group sized to the module's grid area.
  // Add any Konva shapes to it.
  const circle = new Konva.Circle({
    x: group.width() / 2,
    y: group.height() / 2,
    radius: 20,
    fill: 'red',
  });
  group.add(circle);
}
```

`draw()` is called once from `init()`, after the background rectangle and plug indicators are added.

---

## Registering a new module

Three files must be updated for every new module.

### 1. `src/core/RackSerializer.ts` — MOD_REGISTRY

Import the class and add it to `MOD_REGISTRY` so it can be instantiated from a saved YAML file:

```ts
import MyModule from '../[category]/MyModule';

const MOD_REGISTRY: Record<string, AnyModConstructor> = {
  // ... existing entries ...
  MyModule,
};
```

### 2. `synt.schema.json` — type enum

Add the class name to the `"type"` enum so YAML files are validated:

```json
"enum": ["...", "MyModule"]
```

### 3. `src/core/SystemRack.ts` — prototype palette

Import the class and add an entry to `PROTOS` so the module appears in the draggable panel:

```ts
import MyModule from '../[category]/MyModule';

const PROTOS: ProtoEntry[] = [
  // ...
  { Ctor: MyModule, label: 'mymod', x: N, y: N },
];
```

`x` and `y` are grid column/row positions in the palette (0-based). Pick an unused cell.

---

## Testing

Integration tests live in `tests/integration/` and mirror the `src/` directory structure. The Tone.js mock at `tests/__mocks__/tone.ts` is wired automatically by Jest via `moduleNameMapper`.

### TestOscillator helper (source modules)

Override `createOutputNode()` with a stub that exposes `connect`, `disconnect`, and `dispose` as `jest.fn()`:

```ts
// tests/integration/oscillator/TestMySineOscillator.ts
import { Oscillator as ToneOscillator } from 'tone';
import MySineOscillator from '../../../src/oscillator/MySineOscillator';

export default class TestMySineOscillator extends MySineOscillator {
  protected createOutputNode(): ToneOscillator {
    return {
      frequency: { value: 0 },
      connect: jest.fn(),
      disconnect: jest.fn(),
      dispose: jest.fn(),
    } as unknown as ToneOscillator;
  }
}
```

### Effect integration test pattern

Integration tests verify Tone.js graph wiring — that node `connect()` / `disconnect()` are called on the right audio nodes when plugs are linked/unlinked:

```ts
test('1 oscillator + 1 effect + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const effect = new MyTremolo();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  effect.plug([oscillator, null, null, null]);
  speaker.plug([effect, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(effect.audioInputNode);
  expect(effect.node?.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('snatch oscillator', () => {
  // ... setup and plug ...
  const oscNode = oscillator.node;
  oscillator.snatch();

  expect(oscNode?.disconnect).toHaveBeenCalledWith(effect.audioInputNode);
});
```

### Adding effect mocks to the Tone.js mock

If your effect uses a Tone.js class not yet in `tests/__mocks__/tone.ts`, add it:

```ts
const MyEffect = jest.fn(() => ({
  frequency: { value: 0 },
  connect: jest.fn(),
  disconnect: jest.fn(),
  dispose: jest.fn(),
  start: jest.fn().mockReturnThis(),
}));

export { MyEffect, /* existing exports */ };
```

