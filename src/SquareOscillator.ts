import Gibberish from 'gibberish-dsp';
import Oscillator from './Oscillator';

export default class SineOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'square';
    this.node = Gibberish.oscillators.Square(this.getDefaultOptions());
  }
}
