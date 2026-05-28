import { Oscillator as ToneOscillator } from 'tone';
import SourceMod from '../core/SourceMod';
import PlugType from '../core/PlugType';
import Signals from '../core/Signals';
import PlugPosition from '../core/PlugPosition';

export default abstract class Oscillator extends SourceMod {
  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');
  }

  protected abstract createOutputNode(): ToneOscillator;

  /**
   * Expose the underlying Tone.js oscillator node for subclasses and tests.
   */
  get node(): ToneOscillator | null {
    return this.outputNode as ToneOscillator | null;
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      (this.outputNode as ToneOscillator).frequency.value = value * 400;
    }
  }

  override onSignalChanged(inputSignals: Signals): Signals {
    this.ensureOutputNode();
    return super.onSignalChanged(inputSignals);
  }
}

