import type { ugen } from 'gibberish-dsp';
import AudioMod from './AudioMod';
import PlugType from './PlugType';
import Signals from './Signals';
import ControlSignal from './ControlSignal';
import PlugPosition from './PlugPosition';
import AudioSignal from './AudioSignal';

export default abstract class Oscillator extends AudioMod {
  node: ugen | null = null;

  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');
  }

  protected getDefaultOptions(): Record<string, unknown> {
    return {
      frequency: 220,
      antialias: true,
    };
  }

  protected abstract createNode(): ugen;

  onSignalChanged(inputSignals: Signals): Signals {
    if (!this.node) {
      this.node = this.createNode();
    }
    const outputSignals: Signals = [null, null, null, null];
    outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal) {
      this.node.frequency = controlSignal.value * 400;
    }
    return outputSignals;
  }
}
