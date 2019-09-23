import { TOscillatorType } from 'standardized-audio-context';
import Oscillator from './Oscillator';

export default class SquareOscillator extends Oscillator {
  type: TOscillatorType = 'square';

  constructor() {
    super();
    this.label = 'square';
  }
}
