import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
import Konva from 'konva';
import { Signals, BrokenAudioSignal, ControlSignal } from './signal';

export default class Button extends Mod {
  constructor() {
    super();
    this.configure('', 1, 1, [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.CTRLOUT]);
  }

  draw(group:Konva.Group) {
    let padding: number = 30;
    const cornerRadius = 5;

    const outsideRect = new Konva.Rect({
      x: padding,
      y: padding,
      width:  group.width() - padding*2,
      height: group.height() - padding*2,
      cornerRadius: 5,
      stroke: 'black',
      strokeWidth: 3,
    });
    group.add(outsideRect);

    padding += 5;
    const insideRect = new Konva.Rect({
      x: padding,
      y: padding,
      width:  group.width() - padding*2,
      height: group.height() - padding*2,
      cornerRadius: 2.5,
      stroke: 'black',
      fill: 'black',
    });
    group.add(insideRect);

    group.on('mousedown', () => {
      this.pushOutput(PlugPosition.WEST, new ControlSignal(1));
    });

    group.on('mouseup', () => {
      this.pushOutput(PlugPosition.WEST, new ControlSignal(0));
    });
  }
}
