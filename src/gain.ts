import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
import { Signals, AudioSignal, BrokenAudioSignal, ControlSignal} from './signal';
import { AudioContext, GainNode } from 'standardized-audio-context';

export default class Gain extends Mod {
  gain: GainNode<AudioContext>|null = null;

  constructor() {
    super();
    this.configure('gain', 1, 1, [PlugType.IN, PlugType.CTRLIN, PlugType.OUT]);
  }

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
        //this.gain.gain.value = value * this.gain.gain.maxValue / this.gain.gain.maxValue;
      }
    });

    return outputSignals;
  }
}
