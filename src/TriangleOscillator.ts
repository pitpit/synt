import Gibberish from 'gibberish-dsp';
import Oscillator from './Oscillator';

export default class TriangleOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'triangle';
  }

  protected createNode(): any {
    return Gibberish.oscillators.Triangle(this.getDefaultOptions());
  }
}
