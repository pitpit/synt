import Mod from './mod';
import ioType from './ioType';
import * as Pizzicato from 'pizzicato';

export default class Note extends Mod {
  wave:Pizzicato.Sound;

  constructor() {
    super(1, 1, [ioType.NULL, ioType.NULL, ioType.OUT]);
    this.label = 'osc';

    this.wave = new Pizzicato.Sound({
      source: 'wave',
      options: {
        frequency: 440,
      },
    });
  }

  tune(group: Pizzicato) {
    group.addSound(this.wave);
  }

  untune(group: Pizzicato) {
    group.removeSound(this.wave);
  }
}
