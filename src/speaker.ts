import Mod from './mod';
import IoType from './ioType';
import Konva from 'konva';
import Pizzicato from 'pizzicato';

export default class Speaker extends Mod {

  constructor() {
    super(1, 1, [IoType.IN]);

    this.events.on('linked', (mod: Mod, cardinal: number) => {
      console.log('speaker linked');
      const group = mod.getOutput(cardinal);
      if (group) {
        if (!(group !instanceof Pizzicato.Group)) {
          throw new Error('Uncompatible IO');
        }
        group.play();
      }
    });

    this.events.on('unlinked', (mod: Mod, cardinal: number) => {
      console.log('speaker unlinked');
      const group = mod.getOutput(cardinal);
      if (group) {
        if (!(group !instanceof Pizzicato.Group)) {
          throw new Error('Uncompatible IO');
        }
        group.stop();
      }
    });
  }

  draw(group:Konva.Group) {
    super.draw(group);

    const circle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: 24,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 6,
    });

    const innerCircle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: 12,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 3,
    });

    group.add(circle);
    group.add(innerCircle);
  }
}
