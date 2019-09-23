import { TOscillatorType } from 'standardized-audio-context';
import Oscillator from './Oscillator';

export default class SineOscillator extends Oscillator {
  type: TOscillatorType = 'sine';

  constructor() {
    super();
    this.label = 'sine';
  }
}
