import { TOscillatorType } from 'standardized-audio-context';
import Oscillator from './Oscillator';

export default class SawtoothOscillator extends Oscillator {
  type: TOscillatorType = 'sawtooth';

  constructor() {
    super();
    this.label = 'sawtooth';
  }
}
