import { Oscillator as ToneOscillator } from 'tone';
import Oscillator from './Oscillator';

export default class TriangleOscillator extends Oscillator {
  constructor() {
    super();
    this.label = 'triangle';
  }

  protected createOutputNode(): ToneOscillator {
    return new ToneOscillator({ frequency: 220, type: 'triangle' }).start();
  }
}
