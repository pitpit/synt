import Mod from './mod';
import ioType from './ioType';
import { Group } from 'konva/lib/Group.js';
import { Circle } from 'konva/lib/shapes/Circle.js';
import * as Pizzicato from 'pizzicato';

export default class Speaker extends Mod {
  constructor() {
    super(1, 1, [ioType.IN]);

    this.events.on('link-to-north', (mod:Mod, group:Pizzicato) => {
      group.play();
    });
  }

  draw(group:Group) {
    super.draw(group);

    const circle = new Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: 24,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 6,
    });

    const innerCircle = new Circle({
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
