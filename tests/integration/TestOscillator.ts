import type { ugen } from 'gibberish-dsp';
import Oscillator from '../../src/Oscillator';

export default class TestOscillator extends Oscillator {
  constructor() {
    super();
    this.node = { sound: 666 } as ugen;
  }

  protected createNode(): ugen {
    return { sound: 666 } as ugen;
  }
}
