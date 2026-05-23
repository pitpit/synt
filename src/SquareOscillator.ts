import Gibberish from 'gibberish-dsp';
import Oscillator from './Oscillator';

export default class SquareOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'square';
  }

  protected createNode(): any {
    return Gibberish.oscillators.Square(this.getDefaultOptions());
  }
}
