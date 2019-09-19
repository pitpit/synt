import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
import Konva from 'konva';
import { Signals, BrokenAudioSignal, ControlSignal } from './signal';

export default class Button extends Mod {
  controlSignal: ControlSignal|null = null;

  constructor() {
    super();
    this.configure('', 1, 1, [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.CTRLOUT]);
  }

  draw(group:Konva.Group) {
    let padding: number = 30;
    const cornerRadius = 5;

    const rect1 = new Konva.Rect({
      x: padding,
      y: padding,
      width:  group.width() - padding*2,
      height: group.height() - padding*2,
      cornerRadius,
      stroke: 'black',
      strokeWidth: 3,
    });
    group.add(rect1);

    padding += 4.5;
    const rect2 = new Konva.Rect({
      x: padding,
      y: padding,
      width:  group.width() - padding*2,
      height: group.height() - padding*2,
      cornerRadius,
      stroke: 'black',
      fill: 'black',
    });
    group.add(rect2);

    group.on('click', () => {
      if (this.controlSignal) {
        this.controlSignal.callback(1);
      }
    });
  }

  process(inputSignals: Signals): Signals {
    const signal = inputSignals[PlugPosition.WEST];
    if (signal instanceof ControlSignal) {
      this.controlSignal = signal;
    } else if (signal instanceof BrokenAudioSignal) {
      this.controlSignal = null;
    }

    return [null, null, null, null];
  }
}
