import Gibberish from 'gibberish-dsp';
import Oscillator from './Oscillator';

export default class SineOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'triangle';
    this.oscillator = Gibberish.oscillators.Triangle({ frequency: 220 });
  }
}
