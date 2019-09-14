import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';

export default class Oscillator extends Mod {
  oscillator: OscillatorNode|null = null;

  constructor() {
    super();

    this.configure('osc', 1, 1, [PlugType.NULL, PlugType.CTRL, PlugType.OUT]);
  }

  getOutput(plugPosition: number): any {
    // This is the sound output
    if (PlugPosition.SOUTH === plugPosition) {
      return this.oscillator;
    }

    // This is the control plug to plug in a knob
    if (PlugPosition.EAST === plugPosition) {
      return (value: number) => {
        // value:0 => this.panner.pan.value:-1
        // value:0.5 => this.panner.pan.value:0
        // value:1 => this.panner.pan.value:1
        if (this.oscillator) {
          this.oscillator.frequency.value = value * 1400 + 40;
        }
      };
    }

    return null;
  }

  wire(audioContext:AudioContext): void {
    if (!this.oscillator) {
      this.oscillator = audioContext.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = 440;
      this.oscillator.start(0);
    }
  }

  unwire(audioContext:AudioContext): void {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator = null;
    }
  }
}
