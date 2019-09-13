import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';

export default class Flanger extends Mod {
  gain: GainNode|null = null;

  constructor() {
    super();

    this.configure('flanger', 1, 1, [PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  getOutput(plugPosition: number): any {
    return this.gain;
  }

  wire(audioContext:AudioContext): void {
    this.gain = audioContext.createGain();

    const output = this.getInput(PlugPosition.NORTH);
    if (output instanceof AudioNode) {
      output.connect(this.gain);
    }
  }

  unwire(audioContext:AudioContext): void {
    if (this.gain) {
      const output = this.getInput(PlugPosition.NORTH);
      if (output instanceof AudioNode) {
        output.disconnect(this.gain);
      }
      this.gain = null;
    }
  }
}
