import Oscillator from './Oscillator';
import { TOscillatorType } from 'standardized-audio-context';

export default class SawtoothOscillator extends Oscillator {
  type: TOscillatorType = 'sawtooth';

  constructor() {
    super();
    this.label = 'sawtooth';
  }
}
