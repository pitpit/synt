import { Oscillator as ToneOscillator } from 'tone';
import AudioMod from '../core/AudioMod';
import PlugType from '../core/PlugType';
import Signals from '../core/Signals';
import ControlSignal from '../core/ControlSignal';
import PlugPosition from '../core/PlugPosition';
import AudioSignal from '../core/AudioSignal';

export default abstract class Oscillator extends AudioMod {
  node: ToneOscillator | null = null;

  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');
  }

  protected getDefaultOptions(): Record<string, unknown> {
    return {
      frequency: 220,
    };
  }

  protected abstract createNode(): ToneOscillator;

  onSignalChanged(inputSignals: Signals): Signals {
    if (!this.node) {
      this.node = this.createNode();
    }
    const outputSignals: Signals = [null, null, null, null];
    outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal) {
      this.node.frequency.value = controlSignal.value * 400;
    }
    return outputSignals;
  }
}
