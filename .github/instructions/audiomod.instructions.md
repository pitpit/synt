---
description: "Use when creating, editing, or reviewing audio modules (oscillators, effects, control modules, output modules). Covers base class selection, plug configuration, Tone.js node patterns, signal handling, CV mapping, BrokenAudioSignal disposal, and registration steps."
applyTo: ["src/effect/**/*.ts", "src/oscillator/**/*.ts", "src/output/**/*.ts"]
---
# Writing an AudioMod

## Base Class

Extend `AudioMod` (rather than `Mod` directly) when your module processes or produces audio.

## File & Export Conventions

- One class per file. Filename = class name in PascalCase. e.g. `LowPassFilter.ts` → `export default class LowPassFilter`.
- Place files in `src/effect/`, `src/oscillator/`, or `src/output/` as appropriate.
- Import core types two levels up: `import AudioMod from '../core/AudioMod'`.
- Alias Tone.js imports to avoid name collisions: `import { Filter as ToneFilter } from 'tone'`.
- Use `import type` for type-only imports from Tone.js.

## Plug Configuration

Call `this.configure(plugTypes, label?)` inside the constructor. `plugTypes` is a 4-element array indexed by `PlugPosition` [NORTH=0, EAST=1, SOUTH=2, WEST=3].

```ts
import PlugType from '../core/PlugType';

// Oscillator — no audio input, CV control input, audio output
this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');

// Effect — audio in/out + CV control input
this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'filter');
```

Standard layouts:
- **Oscillators:** `[NULL, CTRLIN, OUT, NULL]`
- **Effects:** `[IN, CTRLIN, OUT, NULL]`
- **Sinks (Speaker):** `[IN, CTRLIN, NULL, NULL]`
- **Control sources:** `[NULL, NULL, NULL, CTRLOUT]`

## Signal Types

```ts
import AudioSignal from '../core/AudioSignal';
import ControlSignal from '../core/ControlSignal';
import BrokenAudioSignal from '../core/BrokenAudioSignal';
```

- `AudioSignal` — wraps a `ToneAudioNode`. Indicates live audio flowing.
- `ControlSignal` — carries a `value: number` in range `[0, 1]`.
- `BrokenAudioSignal` — signals a disconnected/disposed node. Must be propagated downstream.

## Implementing `onSignalChanged`

Always return a full 4-element `Signals` array initialized to `[null, null, null, null]`.

### Oscillator pattern — create once, reuse

```ts
import PlugPosition from '../core/PlugPosition';
import Signals from '../core/Signals';
import { Oscillator as ToneOscillator } from 'tone';

onSignalChanged(inputSignals: Signals): Signals {
  if (!this.node) {
    this.node = new ToneOscillator({ frequency: 220, type: 'sine' }).start();
  }

  const outputSignals: Signals = [null, null, null, null];
  outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);

  const ctrl = inputSignals[PlugPosition.EAST];
  if (ctrl instanceof ControlSignal) {
    this.node.frequency.value = ctrl.value * 400; // map 0–1 → 0–400 Hz
  }

  return outputSignals;
}
```

### Effect pattern — recreate on each new audio input

```ts
import { Filter as ToneFilter } from 'tone';

private node: ToneFilter | null = null;

onSignalChanged(inputSignals: Signals): Signals {
  const outputSignals: Signals = [null, null, null, null];
  const input = inputSignals[PlugPosition.NORTH];

  if (input instanceof AudioSignal && input.node) {
    this.node?.dispose();
    this.node = new ToneFilter(1000, 'lowpass');
    input.node.connect(this.node);
    outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);
  } else if (input instanceof BrokenAudioSignal) {
    outputSignals[PlugPosition.SOUTH] = new BrokenAudioSignal(this.node);
    this.node = null;
    queueMicrotask(() => { this.node?.dispose(); });
  }

  const ctrl = inputSignals[PlugPosition.EAST];
  if (ctrl instanceof ControlSignal && this.node) {
    this.node.frequency.value = ctrl.value * 4000; // map 0–1 to 0–4000 Hz
  }

  return outputSignals;
}
```

## CV Mapping Conventions

Scale `ControlSignal.value` (always `[0, 1]`) to the Tone.js parameter range:

| Parameter | Typical mapping |
|---|---|
| Frequency (Hz) | `value * 400` for pitch, `value * 10` for modulation rate |
| Panning | `(value * 2) - 1` → `-1` (left) to `+1` (right) |
| Gain/amplitude | `value` (0–1 is already linear) |
| Arbitrary rate | `value * maxRate` |

## BrokenAudioSignal Rules

- Always handle `BrokenAudioSignal` in `onSignalChanged`.
- Emit `new BrokenAudioSignal(this.node)` on all downstream audio outputs.
- Call `queueMicrotask(() => { this.node?.dispose(); })` to release the Tone.js node.

> **Why `queueMicrotask`?** Disposing synchronously would destroy the node while the `BrokenAudioSignal` is still propagating through the graph. Downstream modules would receive the signal and try to reference an already-destroyed node. `queueMicrotask` defers disposal until after propagation has fully unwound.

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

Add an entry to the `PROTOS` array so the module appears in the draggable panel:

```ts
import MyModule from '../[category]/MyModule';

const PROTOS: ProtoEntry[] = [
  // ...
  { Ctor: MyModule, label: 'mymod', x: N, y: N },
];
```

## Testing

Integration tests live in `tests/integration/` mirroring `src/`. The Tone.js mock at `tests/__mocks__/tone.ts` is wired via `moduleNameMapper` in Jest config.

### Test helper for lazy-once (oscillator) modules

Pre-seed `this.node` to avoid calling `createNode()`:

```ts
// tests/integration/oscillator/TestMySineOscillator.ts
import type { ToneAudioNode } from 'tone';
import MySineOscillator from '../../../src/oscillator/MySineOscillator';

export default class TestMySineOscillator extends MySineOscillator {
  constructor() {
    super();
    this.node = { frequency: { value: 0 } } as unknown as ToneAudioNode;
  }
}
```

### Tone.js mock for recreate-on-input (effect) modules

Add the class to `tests/__mocks__/tone.ts`:

```ts
const MyEffect = jest.fn((param) => ({
  frequency: { value: param },
  connect: jest.fn(),
  disconnect: jest.fn(),
  dispose: jest.fn(),
  start: jest.fn().mockReturnThis(),
}));

export { MyEffect, /* existing exports */ };
```

## Quick Checklist

- [ ] Correct base class ( `AudioMod`)
- [ ] `configure()` called in constructor with matching plug types
- [ ] `onSignalChanged` returns a 4-element `Signals` array
- [ ] `BrokenAudioSignal` is handled and propagated
- [ ] Tone.js node disposed via `queueMicrotask(() => { this.node?.dispose(); })` on `BrokenAudioSignal`
- [ ] Registered in `MOD_REGISTRY`, `synt.schema.json`, and `SystemRack.ts`
- [ ] File exported as `export default class ClassName`
- [ ] Tone.js imports aliased to avoid name collisions
