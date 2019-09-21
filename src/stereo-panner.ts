import AudioMod from './audio-mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';
import { Signals, AudioSignal, BrokenAudioSignal, ControlSignal} from './signal';
import { AudioContext, StereoPannerNode } from 'standardized-audio-context';

export default class StereoPanner extends AudioMod {
  panner: StereoPannerNode<AudioContext>|null = null;

  constructor() {
    super();
    this.configure('stereo', 1, 1, [PlugType.IN, PlugType.CTRLIN, PlugType.OUT]);
  }

  getOutputs(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    const signal = inputSignals[PlugPosition.NORTH];
    if (this.audioContext && signal instanceof AudioSignal) {
      this.panner = this.audioContext.createStereoPanner();
      this.panner.pan.value = 0;
      signal.node.connect(this.panner);
      outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.panner);
    } else if (signal instanceof BrokenAudioSignal) {
      // Transmit BrokenAudioSignal as it
      outputSignals[PlugPosition.SOUTH] = signal;
    }

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (
      controlSignal instanceof ControlSignal
      && this.panner
    ) {
      // value:0 => this.panner.pan.value:-1
      // value:0.5 => this.panner.pan.value:0
      // value:1 => this.panner.pan.value:1
      this.panner.pan.value = controlSignal.value * 2 - 1; // Range -1 to 1
      console.log(this.panner.pan.value)
    }

    return outputSignals;
  }
}
