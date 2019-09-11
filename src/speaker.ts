import Mod from './mod';
import IoType from './ioType';
import Konva from 'konva';

export default class Speaker extends Mod {

  constructor() {
    super(1, 1, [IoType.IN]);
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
