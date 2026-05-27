import { Gain as ToneGain } from 'tone';
import Konva from 'konva';
import SinkMod from '../core/SinkMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class Speaker extends SinkMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN]);
  }

  draw(group: Konva.Group) {
    const outterCircleRadius = 32;
    const outterCircleStrokeWidth = 8;
    const innerCircleRadius = 10;
    const innerCircleStrokeWidth = 2;

    const outterCircle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: outterCircleRadius,
      fillEnabled: false,
      stroke: 'black',
      strokeWidth: outterCircleStrokeWidth,
    });
    const topLeftArc = new Konva.Arc({
      x: group.width() / 2,
      y: group.height() / 2,
      innerRadius: innerCircleRadius + innerCircleStrokeWidth / 2,
      outerRadius: outterCircleRadius - outterCircleStrokeWidth / 2,
      fill: 'lightgray',
      angle: 180,
      rotation: 135,
    });
    const innerCircle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: innerCircleRadius,
      fill: 'black',
      stroke: 'black',
      strokeWidth: innerCircleStrokeWidth,
    });

    const reflectCircle = new Konva.Circle({
      x: group.width() / 2 + 4,
      y: group.height() / 2 - 4,
      radius: 2.5,
      fill: 'white',
    });

    group.add(outterCircle);
    group.add(topLeftArc);
    group.add(innerCircle);
    group.add(reflectCircle);
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      this.gain = value;
      (this.audioInputNode).gain.value = value;
    }
  }
}

