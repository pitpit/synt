import Oscillator from './Oscillator';
import { TOscillatorType } from 'standardized-audio-context';

export default class SquareOscillator extends Oscillator {
  type: TOscillatorType = 'square';

  constructor() {
    super();
    this.label = 'square';
  }
}
