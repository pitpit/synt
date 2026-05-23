import Gibberish from 'gibberish-dsp';
import Oscillator from './Oscillator';

export default class SawtoothOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'saw';
  }

  protected createNode(): any {
    return Gibberish.oscillators.Saw(this.getDefaultOptions());
  }
}
