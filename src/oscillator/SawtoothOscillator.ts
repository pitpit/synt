import type { ugen } from 'gibberish-dsp';
import Gibberish from 'gibberish-dsp';
import Oscillator from './Oscillator';

export default class SawtoothOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'saw';
  }

  protected createNode(): ugen {
    return Gibberish.oscillators.Saw(this.getDefaultOptions());
  }
}
