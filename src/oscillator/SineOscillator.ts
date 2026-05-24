import { Oscillator as ToneOscillator } from 'tone';
import Oscillator from './Oscillator';

export default class SineOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'sine';
  }

  protected createNode(): ToneOscillator {
    return new ToneOscillator({ frequency: 220, type: 'sine' }).start();
  }
}
