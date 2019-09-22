import Oscillator from './Oscillator';
import { TOscillatorType } from 'standardized-audio-context';

export default class SineOscillator extends Oscillator {
  type: TOscillatorType = 'sine';

  constructor() {
    super();
    this.label = 'sine';
  }
}
