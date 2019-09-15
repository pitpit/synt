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

  onLinked(audioContext:AudioContext): void {
    this.gain = audioContext.createGain();

    const input = this.getInput(PlugPosition.NORTH);
    if (input instanceof AudioNode) {
      input.connect(this.gain);
    }
  }

  onUnlinked(audioContext:AudioContext): void {
    if (this.gain) {
      const input = this.getInput(PlugPosition.NORTH);
      if (input instanceof AudioNode) {
        input.disconnect(this.gain);
      }
      this.gain = null;
    }
  }
}
