import Mod from './mod';
import IO from './io';
import { Circle } from 'konva/lib/shapes/Circle.js';

export default class Speaker extends Mod {
  constructor(x:number = 0, y:number = 0) {
    super(x, y, 1, 1, [IO.IN]);
  }

  draw(group:any) {
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
