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
- [Testing](docs/03-testing.md) — unit, integration, and end-to-end browser testing strategy

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
- [ ] Keyboard input (assign a key to a switch)
- [ ] set a direct value for a Mod
- [ ] import / export in yaml
- [ ] have a smaller js bundle for smaller or older device acting as a client. Ability to push a synt setup to it?

### Modules

- [ ] create duplicable/instanciable modules (to build more complex instruments)
- [ ] Add a file player Mod?
- [ ] implement Flanger & Reverb effects
- [ ] Protect against link loop?
- [ ] Add a display module (for instance, to see an oscillator wave)
- [ ] transition sound when linking a Control Mod to avoic clicks
- [ ] when connecting a knob on a Mod, it should set its value to the linked Mod value (and animate)

### UX

- [ ] drag'n drop new Mod in the interface
- [ ] add a sticky note mode to write info / doc / quick tour to explain how to use the interface
- [ ] how can we adjut a know on mobile?  edit and play modes?
- [X] replace the green and the red marker by a red & green marker (to show which plug can plug altogether)
- [X] Responsive view on small screens
- [ ] Add several layers to put more Mods?
- [ ] Ability to rotate Mod on Rack

### Codebase

- [X] Add a public licence
- [X] Switch from Gibberish to Tone.js?
- [X] Improve the src/ subtree structure to make it easier to understand
- [ ] Switch from webpack to vite
- [X] Upgrade to last node LTS version and update dependencies
- [X] Switch from TravisCI to Github Actions
- [X] PlugType.CTRL should be splitted into PlugType.CTRLOUT and  PlugType.CTRLIN
- [X] Specific draw for knob with animation when changing value
- [X] Camel case filenames
- [X] Gain value on Speaker should be controllable by Knob Mod

### Documentation

- [ ] How to serve it from various devices (smartphone, esp32...)
