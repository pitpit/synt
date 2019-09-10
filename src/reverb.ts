import Mod from './mod';
import IoType from './ioType';
import Pizzicato from 'pizzicato';

export default class Reverb extends Mod {
  reverb: Pizzicato.Effects.Reverb;
  group: Pizzicato.Group|null = null;

  constructor() {
    super(1, 1, [IoType.IN, IoType.NULL, IoType.OUT]);
    this.label = 'reverb';

    this.reverb = new Pizzicato.Effects.Reverb({
      time: 0.50,
      decay: 0.50,
      reverse: false,
      mix: .5,
    });

    this.events.on('linked', (mod: Mod, cardinal: number) => {
      console.log('reverb linked');
      const group = mod.getOutput(cardinal);
      console.log(group);
      if (group) {
        if (!(group !instanceof Pizzicato.Group)) {
          throw new Error('Uncompatible IO');
        }
        this.group = group;
        group.addEffect(this.reverb);
      }
    });

    this.events.on('unlinked', (mod: Mod, cardinal: number) => {
      const group = mod.getOutput(cardinal);
      console.log('reverb unlinked');
      if (group) {
        if (!(group !instanceof Pizzicato.Group)) {
          throw new Error('Uncompatible IO');
        }
        this.group = null;
        group.removeEffect(this.reverb);
      }
    });
  }

  getOutput(cardinal: number): any {
    return this.group;
  }
}
