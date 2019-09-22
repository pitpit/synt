import Oscillator from './Oscillator';
import { TOscillatorType } from 'standardized-audio-context';

export default class TriangleOscillator extends Oscillator {
  type: TOscillatorType = 'triangle';

  constructor() {
    super();
    this.label = 'triangle';
  }
}
