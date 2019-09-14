import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';

export default class StereoPanner extends Mod {
  panner: StereoPannerNode|null = null;

  constructor() {
    super();

    this.configure('panner', 1, 1, [PlugType.IN, PlugType.CTRL, PlugType.OUT]);
  }

  getOutput(plugPosition: number): any {
    // This is the sound output
    if (PlugPosition.SOUTH === plugPosition) {
      return this.panner;
    }

    // This is the control plug to plug in a knob
    if (PlugPosition.EAST === plugPosition) {
      return (value: number) => {
        // value:0 => this.panner.pan.value:-1
        // value:0.5 => this.panner.pan.value:0
        // value:1 => this.panner.pan.value:1
        if (this.panner) {
          this.panner.pan.value = value * 2 - 1;
        }
      };
    }

    return null;
  }

  wire(audioContext:AudioContext): void {
    if (!this.panner) {
      this.panner = audioContext.createStereoPanner();
      this.panner.pan.value = -1;
    }

    const input = this.getInput(PlugPosition.NORTH);
    if (input instanceof AudioNode) {
      input.connect(this.panner);
    }
  }

  unwire(audioContext:AudioContext): void {
    if (this.panner) {
      const input = this.getInput(PlugPosition.NORTH);
      if (input instanceof AudioNode) {
        input.disconnect(this.panner);
      }
      this.panner = null;
    }
  }
}
