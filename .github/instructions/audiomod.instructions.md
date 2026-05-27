---
description: "Use when creating, editing, or reviewing audio modules (oscillators, effects, control modules, output modules). Covers base class selection, plug configuration, Tone.js node patterns, CV mapping, and registration steps."
applyTo: ["src/effect/**/*.ts", "src/oscillator/**/*.ts", "src/output/**/*.ts", "src/filter/**/*.ts", "src/control/**/*.ts"]
---
# Writing an Audio Module

## Base Class

Choose the base class that matches the module's role:

| Base class | Use for |
|------------|---------|
| `SourceMod` | Audio generators (oscillators, noise sources) |
| `EffectMod` | Audio processors (effects, filters, gates) |
| `SinkMod` | Audio sinks (speaker output) |

Control-only modules (e.g. `Knob`) extend `Mod` directly.

## File & Export Conventions

- One class per file. Filename = class name in PascalCase. e.g. `LowPassFilter.ts` → `export default class LowPassFilter`.
- Place files in `src/effect/`, `src/oscillator/`, `src/filter/`, `src/control/`, or `src/output/` as appropriate.
- Import core types two levels up: e.g. `import SourceMod from '../core/SourceMod'`.
- Alias Tone.js imports to avoid name collisions: `import { Filter as ToneFilter } from 'tone'`.
- Use `import type` for type-only imports from Tone.js.

## Plug Configuration

Call `this.configure(plugTypes, label?, width?, height?)` inside the constructor. `plugTypes` is indexed by `PlugPosition` [NORTH=0, EAST=1, SOUTH=2, WEST=3]. Trailing `NULL` entries can be omitted.

```ts
import PlugType from '../core/PlugType';

// Source — no audio input, CV control input on EAST, audio output on SOUTH
this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');

// Effect — audio in on NORTH, CV on EAST, audio out on SOUTH
this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'filter');

// Sink — audio in and CV in, no output, 2-slot wide
this.configure([PlugType.IN, PlugType.CTRLIN], 'speaker', 2);
```

## Implementing `SourceMod`

Override `createOutputNode()` to return the Tone.js node. The base class calls it lazily the first time the module is linked downstream.

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

## Implementing `EffectMod`

Override `createEffectNode()` to return the Tone.js node. Tone.js `connect()` / `disconnect()` and node lifecycle are managed automatically by `EffectMod` lifecycle hooks.

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

**Do NOT redeclare `get node()`** — it is already provided by `EffectMod`. Cast inside `mapControl` instead:

```ts
(this.effectNode as ToneTremolo).frequency.value = value * 10;
```

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

## Registration (required for every new module)

### 1. `src/core/RackSerializer.ts` — MOD_REGISTRY

```ts
import MyModule from '../[category]/MyModule';

const MOD_REGISTRY: Record<string, AnyModConstructor> = {
  // ... existing entries ...
  MyModule,
};
```

### 2. `synt.schema.json` — enum list

Add the class name to the `"type"` enum array:

```json
"enum": ["...", "MyModule"]
```

### 3. `src/core/SystemRack.ts` — prototype palette

```ts
import MyModule from '../[category]/MyModule';

const PROTOS: ProtoEntry[] = [
  // ...
  { Ctor: MyModule, label: 'mymod', x: N, y: N },
];
```

## Testing

Integration tests live in `tests/integration/` mirroring `src/`. The Tone.js mock at `tests/__mocks__/tone.ts` is wired via `moduleNameMapper` in Jest config. Tests verify Tone.js graph wiring — that `connect()` / `disconnect()` are called on the right nodes.

### TestOscillator helper (source modules)

Override `createOutputNode()` with a stub exposing `connect`, `disconnect`, `dispose` as `jest.fn()`:

```ts
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

```ts
test('1 oscillator + 1 effect + 1 speaker', () => {
  const oscillator = new TestOscillator();
  const effect = new MyTremolo();
  const speaker = new Speaker();

  oscillator.plug([null, null, null, null]);
  effect.plug([oscillator, null, null, null]);
  speaker.plug([effect, null, null, null]);

  expect(oscillator.node?.connect).toHaveBeenCalledWith(effect.audioInputNode);
  expect(effect.audioOutputNode.connect).toHaveBeenCalledWith(speaker.audioInputNode);
});

test('snatch oscillator', () => {
  // ... setup and plug ...
  const oscNode = oscillator.node;  // capture BEFORE snatch
  oscillator.snatch();

  expect(oscNode?.disconnect).toHaveBeenCalledWith(effect.audioInputNode);
});
```

### Adding effect mocks to the Tone.js mock

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

## Quick Checklist

- [ ] Correct base class (`SourceMod`, `EffectMod`, or `SinkMod`)
- [ ] `configure()` called in constructor with matching plug types
- [ ] `createOutputNode()` (SourceMod) or `createEffectNode()` (EffectMod) implemented
- [ ] `mapControl()` overridden if the module accepts CV input
- [ ] **Do NOT redeclare `get node()`** in `EffectMod` subclasses
- [ ] Registered in `MOD_REGISTRY`, `synt.schema.json`, and `SystemRack.ts`
- [ ] File exported as `export default class ClassName`
- [ ] Tone.js imports aliased to avoid name collisions (e.g. `import { Tremolo as ToneTremolo } from 'tone'`)
