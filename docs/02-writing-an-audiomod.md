# Writing an AudioMod

This guide walks you through implementing a new `AudioMod`. For background on the architecture see [01-architecture.md](01-architecture.md).

Extend `AudioMod` (rather than `Mod` directly) when your module processes or produces audio. Control-only modules such as `Knob` extend `Mod` directly.

---

## Minimal skeleton

Every `AudioMod` needs five things:

```ts
import type { ToneAudioNode } from 'tone';
import AudioMod from '../core/AudioMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import Signals from '../core/Signals';
import AudioSignal from '../core/AudioSignal';
import BrokenAudioSignal from '../core/BrokenAudioSignal';
import ControlSignal from '../core/ControlSignal';

export default class MyEffect extends AudioMod {
  node: ToneAudioNode | null = null;  // (1) Tone.js audio node — created lazily

  constructor() {
    super();
    this.configure(                   // (2) declare plug layout
      [PlugType.IN, PlugType.CTRLIN, PlugType.OUT],
      'my-effect',                    //     optional label
    );
  }

  onSignalChanged(inputSignals: Signals): Signals {  // (3) signal logic
    const outputSignals: Signals = [null, null, null, null];
    // ... your logic here ...
    return outputSignals;
  }
}
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
| `3` | WEST | Rarely used |

Trailing `PlugType.NULL` entries can be omitted — unset positions accept no connections. `label` is the text shown on the module tile. `width` and `height` are the number of grid slots the module occupies (default: 1 × 1).

```ts
// Source — no audio input, control on EAST, audio out on SOUTH
this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');

// Effect — audio in on NORTH, control on EAST, audio out on SOUTH
this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'tremolo');

// Sink — audio in and control in, no output, 2-slot wide
this.configure([PlugType.IN, PlugType.CTRLIN], 'speaker', 2);
```

---

## Two Tone.js node init patterns

### 1. Lazy-once (source modules)

Create the Tone.js node the first time `onSignalChanged` is called and reuse it for the lifetime of the module. No upstream audio input is needed.

```ts
onSignalChanged(inputSignals: Signals): Signals {
  if (!this.node) {
    this.node = new ToneOscillator({ frequency: 220, type: 'sine' }).start();
  }

  const outputSignals: Signals = [null, null, null, null];
  outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);

  const controlSignal = inputSignals[PlugPosition.EAST];
  if (controlSignal instanceof ControlSignal) {
    this.node.frequency.value = controlSignal.value * 400;
  }

  return outputSignals;
}
```

### 2. Recreate on input (processor / effect modules)

Dispose any existing node and create a fresh one each time a new upstream `AudioSignal` arrives. Explicitly connect the upstream node to the new effect node.

```ts
onSignalChanged(inputSignals: Signals): Signals {
  const outputSignals: Signals = [null, null, null, null];
  const inputSignal = inputSignals[PlugPosition.NORTH];

  if (inputSignal instanceof AudioSignal && inputSignal.node) {
    this.node?.dispose();
    this.node = new ToneTremolo(8, 1).start() as ToneTremolo;
    inputSignal.node.connect(this.node);
    outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);
  } else if (inputSignal instanceof BrokenAudioSignal) {
    outputSignals[PlugPosition.SOUTH] = new BrokenAudioSignal(this.node);
    this.node?.dispose();
    this.node = null;
  }

  return outputSignals;
}
```

---

## `onSignalChanged` template

Full annotated template covering every case:

```ts
onSignalChanged(inputSignals: Signals): Signals {
  const outputSignals: Signals = [null, null, null, null];

  // --- Audio input (NORTH) ---
  const inputSignal = inputSignals[PlugPosition.NORTH];

  if (inputSignal instanceof AudioSignal && inputSignal.node) {
    // Valid audio arriving — dispose old node, create and connect a fresh one
    this.node?.dispose();
    this.node = new ToneTremolo(8, 1).start() as ToneTremolo;
    inputSignal.node.connect(this.node);
    outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);

  } else if (inputSignal instanceof BrokenAudioSignal) {
    // Upstream disconnected — propagate the break and release the node
    outputSignals[PlugPosition.SOUTH] = new BrokenAudioSignal(this.node);
    this.node?.dispose();
    this.node = null;
  }
  // null → nothing received yet; leave outputSignals[SOUTH] as null

  // --- Control input (EAST) ---
  const controlSignal = inputSignals[PlugPosition.EAST];
  if (controlSignal instanceof ControlSignal && this.node) {
    this.node.frequency.value = controlSignal.value * 10;   // map [0, 1] → [0, 10]
  }

  return outputSignals;
}
```

---

## `BrokenAudioSignal` propagation rules

When a module is removed or a plug is unlinked, a `BrokenAudioSignal` propagates downstream. Every module in the chain must handle it:

| Module role | What to do |
|-------------|------------|
| **Effect** (IN → OUT) | Dispose the Tone.js node (`this.node?.dispose()`); emit `new BrokenAudioSignal(this.node)` on the output plug; set `this.node = null` |
| **Sink** (IN, no OUT) | Disconnect and dispose the Tone.js node; return `[null, null, null, null]` |
| **Pass-through** (IN → OUT, no processing) | Forward the `BrokenAudioSignal` unchanged to the output plug |

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

## `pushOutput()` for event-driven modules

`onSignalChanged` is invoked by the propagation system in response to upstream changes. If your module needs to emit a signal at an arbitrary time — for example from a user interaction — call `this.pushOutput()` directly from a `draw()` event handler:

```ts
draw(group: Konva.Group) {
  group.on('mousedown', () => {
    if (this.signal) {
      this.pushOutput(PlugPosition.SOUTH, this.signal);
    }
  });
  group.on('mouseup', () => {
    if (this.signal instanceof AudioSignal) {
      this.pushOutput(PlugPosition.SOUTH, new BrokenAudioSignal(this.signal.node));
    }
  });
}
```

`pushOutput(plugPosition, signal)` routes `signal` to the module connected on that plug and starts downstream propagation from there. This is the pattern used by `SwitchOn` to pass audio on press and cut it on release, independently of any upstream signal change.

---

## Testing

Integration tests live in `tests/integration/` and mirror the `src/` directory structure. The Tone.js mock at `tests/__mocks__/tone.ts` is wired automatically by Jest via `moduleNameMapper` and keeps tests free of Web Audio API dependencies.

### Test helper

For modules that wrap a Tone.js node it is easiest to pre-seed `this.node` with a plain object stub cast to the appropriate type. For source modules (lazy-once pattern) this prevents `createNode()` from being called:

```ts
// tests/integration/effect/TestMyEffect.ts
import type { ToneAudioNode } from 'tone';
import MyEffect from '../../../src/effect/MyEffect';

export default class TestMyEffect extends MyEffect {
  constructor() {
    super();
    this.node = { frequency: { value: 0 } } as unknown as ToneAudioNode;
  }
}
```

For effect modules that recreate the node inside `onSignalChanged` (recreate-on-input pattern), add the relevant Tone.js class to `tests/__mocks__/tone.ts`:

```ts
const MyEffect = jest.fn((freq, depth) => ({
  frequency: { value: freq },
  depth: { value: depth },
  connect: jest.fn(),
  disconnect: jest.fn(),
  dispose: jest.fn(),
  start: jest.fn().mockReturnThis(),
}));

export { MyEffect, Gain, getDestination };
```