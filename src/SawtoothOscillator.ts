import Gibberish from 'gibberish-dsp';
import Oscillator from './Oscillator';

export default class SineOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'saw';
    this.node = Gibberish.oscillators.Saw({ frequency: 220 });
  }
}
