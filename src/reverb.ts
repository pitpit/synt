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
      const output = mod.getOutput(cardinal);
      console.log(output);
      if (output && output instanceof Pizzicato.Group) {
        this.group = output;
        output.addEffect(this.reverb);
      }
    });

    this.events.on('unlinked', (mod: Mod, cardinal: number) => {
      const output = mod.getOutput(cardinal);
      console.log('reverb unlinked');
      if (output && output instanceof Pizzicato.Group) {
        this.group = null;
        output.removeEffect(this.reverb);
      }
    });
  }

  getOutput(cardinal: number): any {
    return this.group;
  }
}
