import Mod from './mod';
import PlugType from './plugType';

export default class Oscillator extends Mod {
  oscillator: OscillatorNode|null = null;

  constructor() {
    super();

    this.configure('osc', 1, 1, [PlugType.NULL, PlugType.NULL, PlugType.OUT]);
  }

  getOutput(cardinal: number): any {
    return this.oscillator;
  }

  wire(audioContext:AudioContext): void {
    this.oscillator = audioContext.createOscillator();
    this.oscillator.type = 'sine';

    // this.oscillator.frequency.value = 196;
    this.oscillator.start(0);
  }

  unwire(audioContext:AudioContext): void {
    if (this.oscillator) {
      this.oscillator.stop();
    }
  }
}
