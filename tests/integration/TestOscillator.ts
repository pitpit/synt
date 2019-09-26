import Oscillator from '../../src/Oscillator';

export default class TestOscillator extends Oscillator {
  constructor() {
    super();
    this.node = { sound: 666 };
  }
}
