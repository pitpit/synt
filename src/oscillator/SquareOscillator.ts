import { Oscillator as ToneOscillator } from 'tone';
import Oscillator from './Oscillator';

export default class SquareOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'square';
  }

  protected createOutputNode(): ToneOscillator {
    return new ToneOscillator({ frequency: 220, type: 'square' }).start();
  }
}
