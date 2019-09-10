import Mod from './mod';
import IoType from './ioType';
import * as Pizzicato from 'pizzicato';

export default class Note extends Mod {
  group: Pizzicato.Group;
  wave: Pizzicato.Sound;

  constructor() {
    super(1, 1, [IoType.NULL, IoType.NULL, IoType.OUT]);
    this.label = 'osc';

    this.group = new Pizzicato.Group(); // TODO Should the group be created elsewhere
    this.wave = new Pizzicato.Sound({
      source: 'wave',
      options: {
        frequency: 440,
      },
    });
    this.group.addSound(this.wave);
  }

  getOutput(cardinal: number): any {
    return this.group;
  }
}
