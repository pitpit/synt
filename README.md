# Tuune

Tuune is a project whose main idea is to allow the user
to connect simple modules to build and produce synthetic sounds.
Each module is a square with up to 4 inputs or outputs that can be connected to other modules.
And that's it.

Tuune was also designed to be scalable by facilitating module development
by third party developers.

See the live demo here: https://pitpit.github.io/tuune

THIS PROJECT IS UNDER DEVELOPMENT AND IS NOT YET PROPERLY DOCUMENTED.

----

Tuune est un projet dont l'idée principale est de permettre à l'utilisateur
de connecter de simples modules entre-eux
afin de construire et produire des sons de synthèse de manière empirique.
Chaque module est un carré disposant de 4 entrées ou sorties au maximum pouvant être connectées à d'autres modules.
Et c'est tout.

Tuune a été également conçu afin d'être évolutif en facilitant le développement de module
par des développeurs tiers.

Testez la demo ici : https://pitpit.github.io/tuune

CE PROJET EST EN COURS DE DÉVELOPPEMENT ET N'EST PAS ENCORE CORRECTEMENT DOCUMENTÉ.

## Some documentation

Here's some articles or libraries that have been useful for this project.
I'd would like to thank the authors for their help !

* https://konvajs.org
* https://tonejs.github.io/
* https://github.com/wavesjs/waves-ui
* https://people.carleton.edu/~jellinge/mysynth.html
* https://github.com/chrisguttandin/standardized-audio-context

## TODO

- [X] PlugType.CTRL should be splitted into PlugType.CTRLOUT and  PlugType.CTRLIN
- [X] Specific draw for knob with animation when changing value
- [X] Camel case filenames
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
