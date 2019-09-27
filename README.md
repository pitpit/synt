# Tuune

[![Build Status](https://travis-ci.com/pitpit/tuune.svg?branch=master)](https://travis-ci.com/pitpit/tuune)

Tuune's main idea is to allow the user to assemble tiny modules to build synthetic sounds as easy as pie.
Each module is a square with up to 4 inputs or outputs that can be connected to other modules.
And that's it.

Tuune was also designed to be scalable by facilitating module development
by third party developers.

See the live demo here: https://pitpit.github.io/tuune

THIS PROJECT IS UNDER DEVELOPMENT AND IS NOT YET PROPERLY DOCUMENTED.

![Tuune screenshot](https://raw.githubusercontent.com/pitpit/tuune/master/src/images/screenshot1.png)

## Inspiration

Here's some articles or libraries that have been useful for this project.
I'd would like to thank the authors for their help !

* https://konvajs.org
* https://tonejs.github.io/
* https://github.com/wavesjs/waves-ui
* https://people.carleton.edu/~jellinge/mysynth.html
* https://github.com/chrisguttandin/standardized-audio-context
* https://github.com/gibber-cc/gibberish

## TODO

- [X] PlugType.CTRL should be splitted into PlugType.CTRLOUT and  PlugType.CTRLIN
- [X] Specific draw for knob with animation when changing value
- [X] Camel case filenames
- [ ] Responsive view
- [ ] Keyboard input
- [ ] Protect against link loop
- [ ] Add a file player Mod
- [ ] Ability to rotate Mod on Rack
- [ ] Add a top layer to put more Mods?
- [ ] Specific draw for oscillator
- [ ] implement Flanger & Reverb
- [ ] transition sound when linking a Control Mod to avoic clicks
- [ ] Gain value on Speaker should be controllable by Knob Mod
- [ ] when connecting a know on a Mod, it should set its internal value to the linked Mod value (and animate)
