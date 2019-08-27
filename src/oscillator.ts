import Mod from './mod';
import IoType from './ioType';
import * as Pizzicato from 'pizzicato';

export default class Note extends Mod {
  wave:Pizzicato.Sound;

  constructor() {
    super(1, 1, [IoType.NULL, IoType.NULL, IoType.OUT]);
    this.label = 'osc';

    this.wave = new Pizzicato.Sound({
      source: 'wave',
      options: {
        frequency: 440,
      },
    });
  }

  tune(group: Pizzicato.Group) {
    console.log('osc tune');
    group.addSound(this.wave);
  }

  untune(group: Pizzicato.Group) {
    // group.removeSound(this.wave);
  }
}
