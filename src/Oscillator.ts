import AudioMod from './AudioMod';
import PlugType from './PlugType';
import Signals from './Signals';
import ControlSignal from './ControlSignal';
import PlugPosition from './PlugPosition';
import AudioSignal from './AudioSignal';

export default abstract class Oscillator extends AudioMod {
  node: any;

  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');
  }

  protected getDefaultOptions(): {} {
    return {
      frequency: 220,
      antialias: true,
    };
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal && this.node) {
      this.node.frequency = controlSignal.value * 400;
    }
    return outputSignals;
  }
}
