import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
import Konva from 'konva';
import { Signals, BrokenAudioSignal, ControlSignal } from './signal';

export default class Button extends Mod {
  controlSignal: ControlSignal|null = null;

  constructor() {
    super();
    this.configure('', 1, 1, [PlugType.NULL, PlugType.NULL, PlugType.NULL, PlugType.CTRL]);
  }

  draw(group:Konva.Group) {
    const centerX = group.width() / 2;
    const centerY = group.height() / 2;

    const circle = new Konva.Circle({
      x: centerX,
      y: centerY,
      radius: 14,
      stroke: 'black',
      fill: 'black',
      strokeWidth: 4,
    });

    group.on('click', () => {
      console.log('click');
      if (this.controlSignal) {
        console.log('callback')
        this.controlSignal.callback();
      }
    });
    group.add(circle);
  }

  process(inputSignals: Signals): Signals {

    console.log(inputSignals);

    const signal = inputSignals[PlugPosition.WEST];
    if (signal instanceof ControlSignal) {
      this.controlSignal = signal;
      if (this.controlSignal) {
        this.controlSignal.callback();
      }
    } else if (signal instanceof BrokenAudioSignal) {
      this.controlSignal = null;
    }

    return [null, null, null, null];
  }
}
