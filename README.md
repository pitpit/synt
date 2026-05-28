# Synt

Synt's main idea is to allow the user to assemble tiny modules to build synthetic sounds as easy as pie.
Each module is a square with up to 4 inputs or outputs that can be connected to other modules.
And that's it.

Synt was also designed to be scalable by facilitating module development
by third party developers.

See the live demo here: https://pitpit.github.io/synt

![Synt screenshot](https://raw.githubusercontent.com/pitpit/synt/main/public/img/screenshot1.png)

![Arpeggiator example](https://raw.githubusercontent.com/pitpit/synt/main/public/img/screenshot-arpegiator.png)

## License

Copyright (C) 2026 Damien Pitard

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Documentation

- [Architecture](docs/01-architecture.md) — core concepts, module categories, signal flow, connection rules, and design patterns
- [Writing an AudioMod](docs/02-writing-an-audiomod.md) — step-by-step guide to implementing a new audio module
- [Testing](docs/03-testing-strategy.md) — unit, integration, and end-to-end browser testing strategy

## Inspiration

Here's some articles or libraries that have been useful or inspiring for this project.
I'd would like to thank the authors for their help !

* https://konvajs.org
* https://tonejs.github.io/
* https://github.com/wavesjs/waves-ui
* https://people.carleton.edu/~jellinge/mysynth.html
* https://github.com/chrisguttandin/standardized-audio-context
* [Clara Rigaud](https://clararigaud.com/fr/)
    * https://gitlab.com/obsokit/obsokit
    * https://github.com/zombitron/zombitron

## Developing

Install dependencies:

    npm install

Run web dev server:

    npm start

Run linter:

    npm run lint

Run tests:

    npm test

## Run end-to-end tests

The e2e tests use [Playwright](https://playwright.dev/) and run against a production build served locally. Firefox and WebKit browsers are bundled with Playwright; install them once with:

    npx playwright install chromium firefox webkit

The tests also include a suite of historical Chrome versions (55 through latest) paired with Android device emulation. Download those binaries once with:

    npm run setup:chrome

Then run the full e2e suite:

    npm run test:e2e

An HTML report is generated in `playwright-report/` after each run.

## TODO

### Wild-range support

- [ ] Improve backward compatibility on old browsers
- [ ] list "work well on"
- [X] Add a way to automaticaly test on old browsers?

### Real world integration

- [ ] add midi
- [ ] Keyboard input (assign a key to a switchOn)
- [ ] set a direct value for a Mod?
- [ ] have a smaller js bundle for smaller or older device acting as a client. Ability to push remotly a synt setup to it?
- [X] import / export in yaml

### Modules

- [ ] create duplicable/instanciable modules (to build more complex instruments)
- [ ] Add a file player Mod?
- [ ] Protect against link loop?
- [X] when connecting a knob on a Mod, it should set its value to the linked Mod value (and animate)

#### Oscillators & Sources
- [ ] Wavetable oscillator — playback of user-defined or preset waveforms
- [ ] Noise generator — white, pink, and brown noise
- [ ] Sample & Hold — periodically captures and holds an input value
- [ ] Clock / Tempo — master clock pulse generator with BPM control

#### Envelopes & Modulators
- [ ] ADSR envelope — Attack, Decay, Sustain, Release with gate input
- [ ] AR envelope — simple Attack/Release, loopable
- [ ] LFO-to-CV — dedicated slow LFO with depth and rate knobs
- [ ] Random / S&H — random voltage generator (stepped or smooth)
- [ ] Function generator — slew-limited ramp (rise/fall times)
- [ ] Sequencer — step sequencer with CV and gate outputs (8 or 16 steps)
- [ ] Arpeggiator — enhanced arpeggio patterns (already exists, keep improving)

#### Filters
- [ ] VCF low-pass — 12/24 dB/oct ladder-style low-pass filter with cutoff & resonance
- [X] VCF high-pass — high-pass filter with cutoff control
- [ ] VCF band-pass — band-pass filter with center frequency and bandwidth
- [ ] State-variable filter (SVF) — simultaneous LP/HP/BP outputs
- [ ] Comb filter — resonant comb / Karplus-Strong body
- [ ] Formant filter — vowel-like formant shaping

#### Amplifiers & Mixers
- [ ] VCA (Voltage-Controlled Amplifier) — amplitude controlled by CV
- [ ] Mixer — multi-channel audio/CV mixer with level knobs
- [ ] Attenuverter — scales and inverts a CV signal
- [ ] CV-to-Audio / Audio-to-CV level shifter
- [ ] Crossfader — smooth crossfade between two audio sources

#### Effects
- [ ] Delay — echo with time, feedback, and wet/dry
- [ ] Reverb — convolution or algorithmic reverb
- [X] Chorus — multi-voice pitch detune effect
- [X] Flanger — short delay with LFO modulation
- [X] Phaser — all-pass chain swept by LFO
- [ ] Ring modulator — amplitude modulation producing sum/difference frequencies
- [ ] Waveshaper / Distortion — soft-clip, hard-clip, fold-back
- [ ] Bit crusher — sample-rate and bit-depth reduction
- [ ] Compressor / Limiter — dynamics control with threshold, ratio, attack, release
- [ ] Pitch shifter — real-time pitch transposition

#### Utilities & Logic
- [ ] Quantizer — snaps CV to musical scale/chord
- [ ] Slew limiter / Portamento — smooths abrupt CV changes
- [ ] Voltage offset / DC source — adds a constant CV offset
- [ ] Logic gates — AND, OR, XOR, NOT for gate signals
- [ ] Clock divider — outputs sub-divisions of a master clock
- [ ] Trigger-to-gate / Gate-to-trigger converter
- [ ] Pitch-to-CV — detects audio pitch and outputs a V/Oct CV
- [ ] MIDI-to-CV — converts MIDI note/velocity/CC to CV signals
- [ ] Multiplier / Switch — routes a signal to one of N outputs
- [ ] Scope / Oscilloscope — visual display of an audio or CV waveform

### UX

- [ ] extends the zone to rotate or swipe the knob to the outter-circle
- [ ] extends the zone to click or tap the switchOn to the outter-square
- [ ] on Rack, "drag" cursor when the mod can be drag, "finger" cursor when it can be click, "pan" cursor when the stage can be pan
- [ ] import/export current value of the mod in yaml
- [ ] Add several layers to put more Mods?
- [ ] Ability to rotate Mod on Rack?
- [X] drag'n drop new Mod in the interface
- [X] add a sticky note mode to write info / doc / quick tour to explain how to use the interface
- [X] replace the green and the red marker by a red & green marker (to show which plug can plug altogether)
- [X] Responsive view on small screens

### Codebase

- [X] use vite preview instead of http-server for e2e tests
- [ ] Enable again e2e test for firefox "AudioContext reaches running state after user gesture and Tone.start() does not reject"
- [X] Add a public licence
- [X] Switch from Gibberish to Tone.js?
- [X] Improve the src/ subtree structure to make it easier to understand
- [X] Switch from webpack to vite
- [X] Upgrade to last node LTS version and update dependencies
- [X] Switch from TravisCI to Github Actions
- [X] PlugType.CTRL should be splitted into PlugType.CTRLOUT and  PlugType.CTRLIN
- [X] Specific draw for knob with animation when changing value
- [X] Camel case filenames
- [X] Gain value on Speaker should be controllable by Knob Mod

### Documentation

- [ ] How to serve it from various devices (smartphone, esp32...)
- [ ] Testing strategy
