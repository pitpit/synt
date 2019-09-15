import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';

export default class Gain extends Mod {
  gain: GainNode|null = null;

  constructor() {
    super();

    this.configure('gain', 1, 1, [PlugType.IN, PlugType.CTRL, PlugType.OUT]);
  }

  getOutput(plugPosition: number): any {
    // This is the sound output
    if (PlugPosition.SOUTH === plugPosition) {
      return this.gain;
    }

    // This is the control plug to plug in a knob
    if (PlugPosition.EAST === plugPosition) {
      return (value: number) => {
        // value:0 => this.panner.pan.value:-1
        // value:0.5 => this.panner.pan.value:0
        // value:1 => this.panner.pan.value:1
        if (this.gain) {
          this.gain.gain.value = value * this.gain.gain.maxValue / this.gain.gain.maxValue;
        }
      };
    }

    return null;
  }

  onLinked(audioContext:AudioContext): void {
    if (!this.gain) {
      this.gain = audioContext.createGain();
      this.gain.gain.value = this.gain.gain.defaultValue;
    }

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
