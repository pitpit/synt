import { Oscillator as ToneOscillator } from 'tone';
import Oscillator from './Oscillator';

export default class SawtoothOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'saw';
  }

  protected createOutputNode(): ToneOscillator {
    return new ToneOscillator({ frequency: 220, type: 'sawtooth' }).start();
  }
}
