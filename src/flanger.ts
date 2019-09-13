import Mod from './mod';
import IoType from './ioType';
import Cardinal from './cardinal';

export default class Flanger extends Mod {
  gain: GainNode|null = null;

  constructor() {
    super();

    this.configure('flanger', 1, 1, [IoType.IN, IoType.NULL, IoType.OUT]);
  }

  getOutput(cardinal: number): any {
    return this.gain;
  }

  wire(audioContext:AudioContext): void {
    this.gain = audioContext.createGain();

    const output = this.getInput(Cardinal.NORTH);
    if (output instanceof AudioNode) {
      output.connect(this.gain);
    }
  }

  unwire(audioContext:AudioContext): void {
    if (this.gain) {
      const output = this.getInput(Cardinal.NORTH);
      if (output instanceof AudioNode) {
        output.disconnect(this.gain);
      }
      this.gain = null;
    }
  }
}
