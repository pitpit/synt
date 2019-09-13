import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';

export default class StereoPanner extends Mod {
  panner: StereoPannerNode|null = null;

  constructor() {
    super();

    this.configure('panner', 1, 1, [PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  getOutput(plugPosition: number): any {
    return this.panner;
  }

  wire(audioContext:AudioContext): void {
    this.panner = audioContext.createStereoPanner();
    this.panner.pan.value = -1;

    const output = this.getInput(PlugPosition.NORTH);
    if (output instanceof AudioNode) {
      output.connect(this.panner);
    }
  }

  unwire(audioContext:AudioContext): void {
    if (this.panner) {
      const output = this.getInput(PlugPosition.NORTH);
      if (output instanceof AudioNode) {
        output.disconnect(this.panner);
      }
      this.panner = null;
    }
  }
}
