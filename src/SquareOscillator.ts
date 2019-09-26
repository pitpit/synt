import Gibberish from 'gibberish-dsp';
import Oscillator from './Oscillator';

export default class SineOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'square';
    this.oscillator = Gibberish.oscillators.Square({ frequency: 220 });
  }
}
