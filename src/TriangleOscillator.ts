import { TOscillatorType } from 'standardized-audio-context';
import Oscillator from './Oscillator';

export default class TriangleOscillator extends Oscillator {
  type: TOscillatorType = 'triangle';

  constructor() {
    super();
    this.label = 'triangle';
  }
}
