import Konva from 'konva';
import Mod from '../core/Mod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';
import Signals from '../core/Signals';

export default class ControlMeter extends Mod {
  private displayText: Konva.Text | null = null;

  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.NULL, PlugType.CTRLOUT]);
  }

  draw(group: Konva.Group): void {
    this.displayText = new Konva.Text({
      x: 0,
      y: 0,
      width: group.width(),
      height: group.height(),
      text: '0.000',
      fontSize: 18,
      fontFamily: '"Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace',
      fill: 'black',
      align: 'center',
      verticalAlign: 'middle',
    });
    group.add(this.displayText);
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const ctrlSignal = inputSignals[PlugPosition.EAST];
    if (!(ctrlSignal instanceof ControlSignal)) {
      return [null, null, null, null];
    }
    if (this.displayText !== null) {
      this.displayText.text(ctrlSignal.value.toFixed(3));
      this.displayText.getLayer()?.batchDraw();
    }
    return [null, null, null, ctrlSignal];
  }
}
