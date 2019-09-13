import Mod from './mod';
import IoType from './ioType';
import Cardinal from './cardinal';

export default class StereoPanner extends Mod {
  panner: StereoPannerNode|null = null;

  constructor() {
    super();

    this.configure('panner', 1, 1, [IoType.IN, IoType.NULL, IoType.OUT]);
  }

  getOutput(cardinal: number): any {
    return this.panner;
  }

  wire(audioContext:AudioContext): void {
    this.panner = audioContext.createStereoPanner();
    this.panner.pan.value = -1;

    const output = this.getInput(Cardinal.NORTH);
    if (output instanceof AudioNode) {
      output.connect(this.panner);
    }
  }

  unwire(audioContext:AudioContext): void {
    if (this.panner) {
      const output = this.getInput(Cardinal.NORTH);
      if (output instanceof AudioNode) {
        output.disconnect(this.panner);
      }
      this.panner = null;
    }
  }
}
