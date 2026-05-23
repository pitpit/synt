import Gibberish from 'gibberish-dsp';
import Oscillator from './Oscillator';

export default class SineOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'sine';
  }

  protected createNode(): any {
    return Gibberish.oscillators.Sine(this.getDefaultOptions());
  }
}
