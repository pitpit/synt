import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
import { Signals, AudioSignal, BrokenAudioSignal, ControlSignal} from './signal';
import { AudioContext, GainNode } from 'standardized-audio-context';

export default class Gain extends Mod {
  gain: GainNode<AudioContext>|null = null;

  constructor() {
    super();

    this.configure('gain', 1, 1, [PlugType.IN, PlugType.CTRL, PlugType.OUT]);
  }

  // getOutput(plugPosition: number): any {
  //   // This is the sound output
  //   if (PlugPosition.SOUTH === plugPosition) {
  //     return this.gain;
  //   }

  //   // This is the control plug to plug in a knob
  //   if (PlugPosition.EAST === plugPosition) {
  //     return (value: number) => {
  //       // value:0 => this.panner.pan.value:-1
  //       // value:0.5 => this.panner.pan.value:0
  //       // value:1 => this.panner.pan.value:1
  //       if (this.gain) {
  //         this.gain.gain.value = value * this.gain.gain.maxValue / this.gain.gain.maxValue;
  //       }
  //     };
  //   }

  //   return null;
  // }

  process(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    const signal = inputSignals[PlugPosition.NORTH];
    if (signal instanceof AudioSignal) {
      if (this.audioContext) {
        this.gain = this.audioContext.createGain();
        this.gain.gain.value = this.gain.gain.defaultValue;
        signal.node.connect(this.gain);
        outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.gain);
      }
    } else if (signal instanceof BrokenAudioSignal) {
      // Transmit BrokenAudioSignal as it
      outputSignals[PlugPosition.SOUTH] = signal;
    }


    outputSignals[PlugPosition.EAST] = new ControlSignal((value: number) => {
      if (this.gain) {
        this.gain.gain.value = value;
      }
    });

    return outputSignals;
  }
}
