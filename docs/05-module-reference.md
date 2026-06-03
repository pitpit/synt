# Module Reference

This document describes every audio module in synt — its purpose, plug layout, CV mappings, and noteworthy behaviour. It is the authoritative catalogue of what exists.

**Keep this document up to date.** Every time you add a new module or change a module's plug layout, CV mappings, or behaviour, update the corresponding entry here. See [02-writing-an-audiomod.md](02-writing-an-audiomod.md) for the full implementation guide.

---

## Plug position key

| Index | Label | Common role |
|-------|-------|-------------|
| 0 | NORTH | Audio or control input |
| 1 | EAST | Control (CV) input |
| 2 | SOUTH | Audio or control output |
| 3 | WEST | Second control input / control output |

Plug types: `IN` audio input · `OUT` audio output · `CTRLIN` CV input · `CTRLOUT` CV output · `NULL` no plug.

---

## Oscillators

All oscillators extend the abstract `Oscillator` base class (which extends `SourceMod`). They generate audio with no audio input and accept a CV signal on EAST to modulate pitch.

### SineOscillator

**Source**: [src/oscillator/SineOscillator.ts](../src/oscillator/SineOscillator.ts)
**Tone.js node**: `Oscillator({ type: 'sine' })`

Generates a continuous sine wave. The simplest and smoothest waveform — no harmonic overtones.

| Position | Type | Role |
|----------|------|------|
| NORTH | `NULL` | — |
| EAST | `CTRLIN` | Pitch CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Frequency | `value × 400` → 0–400 Hz |

---

### SquareOscillator

**Source**: [src/oscillator/SquareOscillator.ts](../src/oscillator/SquareOscillator.ts)
**Tone.js node**: `Oscillator({ type: 'square' })`

Generates a square wave. Contains only odd harmonics, producing a hollow, reedy timbre.

| Position | Type | Role |
|----------|------|------|
| NORTH | `NULL` | — |
| EAST | `CTRLIN` | Pitch CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Frequency | `value × 400` → 0–400 Hz |

---

### SawtoothOscillator

**Source**: [src/oscillator/SawtoothOscillator.ts](../src/oscillator/SawtoothOscillator.ts)
**Tone.js node**: `Oscillator({ type: 'sawtooth' })`

Generates a sawtooth wave. Contains all harmonics, producing a bright, buzzy timbre.

| Position | Type | Role |
|----------|------|------|
| NORTH | `NULL` | — |
| EAST | `CTRLIN` | Pitch CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Frequency | `value × 400` → 0–400 Hz |

---

### TriangleOscillator

**Source**: [src/oscillator/TriangleOscillator.ts](../src/oscillator/TriangleOscillator.ts)
**Tone.js node**: `Oscillator({ type: 'triangle' })`

Generates a triangle wave. Softer than a square wave — only odd harmonics at lower amplitudes.

| Position | Type | Role |
|----------|------|------|
| NORTH | `NULL` | — |
| EAST | `CTRLIN` | Pitch CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Frequency | `value × 400` → 0–400 Hz |

---

## Effects

All effect modules extend `EffectMod`. They process audio flowing through them (NORTH → SOUTH) and accept CV on one or two control plugs.

### Tremolo

**Source**: [src/effect/Tremolo.ts](../src/effect/Tremolo.ts)
**Tone.js node**: `Tremolo(8, 1)`

Modulates the amplitude of the audio signal at a controllable rate, creating a rhythmic volume pulse.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `CTRLIN` | Rate CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Modulation rate | `value × 10` → 0–10 Hz |

---

### Vibrato

**Source**: [src/effect/Vibrato.ts](../src/effect/Vibrato.ts)
**Tone.js node**: `Vibrato(5, 0.5)`

Modulates the pitch of the audio signal at a controllable rate, producing the characteristic wavering of vibrato.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `CTRLIN` | Rate CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Modulation rate | `value × 10` → 0–10 Hz |

---

### Reverb

**Source**: [src/effect/Reverb.ts](../src/effect/Reverb.ts)
**Tone.js node**: `Reverb({ decay: 1.5 })`

Simulates acoustic room reverberation. Accepts two independent CV inputs: EAST controls decay time, WEST controls wet/dry mix. This is the only effect module with a `CTRLIN` on WEST.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `CTRLIN` | Decay CV |
| SOUTH | `OUT` | Audio output |
| WEST | `CTRLIN` | Wet/dry CV |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Decay time | `value × 10` → 0–10 s |
| WEST | Wet/dry mix | `value` → 0 (dry) to 1 (full wet) |

---

### Chorus

**Source**: [src/effect/Chorus.ts](../src/effect/Chorus.ts)
**Tone.js node**: `Chorus(1.5, 3.5, 0.7)`

Creates a doubling/thickening effect by mixing slightly delayed and pitch-shifted copies of the signal.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `CTRLIN` | Rate CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Modulation rate | `value × 10` → 0–10 Hz |

---

### Flanger

**Source**: [src/effect/Flanger.ts](../src/effect/Flanger.ts)
**Tone.js node**: `Chorus(0.5, 3.5, 0.5)` with `feedback = 0.4`

A flanging effect built on a short-delay chorus with feedback. Produces the characteristic jet-plane sweep.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `CTRLIN` | Rate CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Modulation rate | `value × 10` → 0–10 Hz |

> **Note**: Internally uses a `Chorus` node with `feedback = 0.4`. The underlying `Chorus` node is reused, so the Tone.js import alias is `Chorus as ToneChorus`.

---

### Phaser

**Source**: [src/effect/Phaser.ts](../src/effect/Phaser.ts)
**Tone.js node**: `Phaser({ frequency: 0.5, octaves: 3, baseFrequency: 350 })`

Sweeps a series of notch filters across the frequency spectrum, producing a swirling, phase-shifted sound.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `CTRLIN` | Rate CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Sweep rate | `value × 10` → 0–10 Hz |

---

### Panner

**Source**: [src/effect/Panner.ts](../src/effect/Panner.ts)
**Tone.js node**: `Panner(0)`

Positions the signal in the stereo field. CV maps linearly from full left to full right.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `CTRLIN` | Pan CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Pan position | `(value × 2) - 1` → -1 (left) to +1 (right) |

---

## Filters

### HighPassFilter

**Source**: [src/filter/HighPassFilter.ts](../src/filter/HighPassFilter.ts)
**Tone.js node**: `Filter(1000, 'highpass')`

Attenuates frequencies below the cutoff, letting higher frequencies pass through. CV on EAST sweeps the cutoff frequency.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `CTRLIN` | Cutoff CV |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Cutoff frequency | `value × 4000` → 0–4000 Hz |

---

## Control modules

Control modules emit or process CV signals. They extend `Mod` directly (for pure-CV modules) or `EffectMod` (when they also sit in the audio signal path).

### Knob

**Source**: [src/control/Knob.ts](../src/control/Knob.ts)
**Base**: `Mod`

A user-controlled rotary knob. Emits a CV value in `[0, 1]` on both EAST and WEST whenever the user adjusts it. Value is persisted across sessions via `KnobMemory`.

| Position | Type | Role |
|----------|------|------|
| NORTH | `NULL` | — |
| EAST | `CTRLOUT` | CV output |
| SOUTH | `NULL` | — |
| WEST | `CTRLOUT` | CV output (same value as EAST) |

**Interaction**: vertical mouse/touch drag adjusts value; scroll wheel also works. Visual rotation is animated with 180 ms easing.

---

### Keyboard

**Source**: [src/control/Keyboard.ts](../src/control/Keyboard.ts)
**Base**: `Mod`

Displays a visual on-screen keyboard image. Outputs a CV signal on WEST representing the active note.

| Position | Type | Role |
|----------|------|------|
| NORTH | `NULL` | — |
| EAST | `NULL` | — |
| SOUTH | `NULL` | — |
| WEST | `CTRLOUT` | Note CV output |

**Visual**: Renders `keyboard.svg` at 100 × 67 px inside the module tile.

---

### Arpeggiator

**Source**: [src/control/Arpeggiator.ts](../src/control/Arpeggiator.ts)
**Base**: `Mod`

A 4-step CV sequencer that cycles through a fixed sequence at a tempo controlled by EAST CV. Outputs the current step's value on WEST.

| Position | Type | Role |
|----------|------|------|
| NORTH | `NULL` | — |
| EAST | `CTRLIN` | Tempo CV |
| SOUTH | `NULL` | — |
| WEST | `CTRLOUT` | Step CV output |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Step interval | `(1 - value) × 1500` → 1500 ms (slow) to 0 ms (fast) — inverted |

**Sequence**: `[0.3, 0.45, 0.55, 0.45]` repeating. The timer restarts whenever the tempo CV changes.

---

### MidiIn

**Source**: [src/control/MidiIn.ts](../src/control/MidiIn.ts)
**Base**: `EffectMod`
**Tone.js node**: `AmplitudeEnvelope`

Connects to a hardware MIDI input device via the Web MIDI API. Translates incoming MIDI note messages into pitch CV on WEST and gates the `AmplitudeEnvelope` for ADSR triggering on the audio path. Double-click the module to open the device selector.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input (gated by envelope) |
| EAST | `NULL` | — |
| SOUTH | `OUT` | Gated audio output |
| WEST | `CTRLOUT` | Pitch CV output |

**Note-to-CV formula**: `440 × 2^((note − 69) / 12) / 400`
(maps MIDI note number to the same 0–400 Hz scale used by oscillators; A4 = 0.825 CV)

**Gate behaviour**: NoteOn triggers the envelope attack; NoteOff releases it. Auto-selects the first available MIDI input on initialisation.

---

### Gate

**Source**: [src/control/Gate.ts](../src/control/Gate.ts)
**Base**: `EffectMod`
**Tone.js node**: `Gain(1)`

A unity-gain pass-through. Passes audio unchanged with no CV inputs. Used as a structural placeholder or connection intermediary.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `NULL` | — |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

No CV mappings.

---

### SwitchOn

**Source**: [src/control/SwitchOn.ts](../src/control/SwitchOn.ts)
**Base**: `EffectMod`
**Tone.js node**: `Gain(0)` (starts silent)

A momentary on/off switch in the audio path. Audio passes only while the user holds the module pressed; releasing mutes the signal.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `NULL` | — |
| SOUTH | `OUT` | Audio output |
| WEST | `NULL` | — |

**Interaction**: mousedown / touchstart → gain 1 (unmute); mouseup / touchend → gain 0 (mute).

---

### ControlMeter

**Source**: [src/control/ControlMeter.ts](../src/control/ControlMeter.ts)
**Base**: `Mod`

Displays the current CV value in the module tile (3 decimal places). Passes the same value through to WEST, allowing multiple meters to be chained in series.

| Position | Type | Role |
|----------|------|------|
| NORTH | `NULL` | — |
| EAST | `CTRLIN` | CV input (measured) |
| SOUTH | `NULL` | — |
| WEST | `CTRLOUT` | CV passthrough |

No transformation — the output value equals the input value. Unlinking EAST resets the cascade and clears the WEST output.

---

### Oscilloscope

**Source**: [src/control/Oscilloscope.ts](../src/control/Oscilloscope.ts)
**Base**: `EffectMod`
**Tone.js node**: `Analyser({ type: 'waveform', size: 2048, channels: 2 })`
**Grid size**: 2 × 2

Real-time stereo waveform visualiser. Sits in the audio path (audio passes through unchanged) and renders left-channel (white) and right-channel (red) waveforms with a zero-crossing trigger for stable display. Both zoom and amplitude are CV-controllable.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `CTRLIN` | Zoom CV |
| SOUTH | `OUT` | Audio output (unchanged) |
| WEST | `CTRLIN` | Amplitude CV |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Sample window (zoom) | log scale: `value` → 16–2048 samples |
| WEST | Amplitude multiplier | log scale: `value` → 0.1×–10× |

**Mono upmixing**: if the upstream source is mono, the module automatically expands it to stereo (both channels carry the same signal).

---

## Output

### Speaker

**Source**: [src/output/Speaker.ts](../src/output/Speaker.ts)
**Base**: `SinkMod`
**Tone.js node**: `Gain(0.5)` → `Tone.getDestination()`
**Grid size**: 2 × 1

The terminal output module. Routes audio to the system audio device via Tone.js's master destination. EAST CV controls the master gain in real time.

| Position | Type | Role |
|----------|------|------|
| NORTH | `IN` | Audio input |
| EAST | `CTRLIN` | Gain CV |
| SOUTH | `NULL` | — |
| WEST | `NULL` | — |

| Plug | Parameter | Mapping |
|------|-----------|---------|
| EAST | Output gain | `value` → 0–1 linear |
