import { AudioContext, GainNode } from 'standardized-audio-context';
import AudioMod from './AudioMod';
import PlugType from './PlugType';
import PlugPosition from './PlugPosition';
import AudioSignal from './AudioSignal';
import BrokenAudioSignal from './BrokenAudioSignal';
import ControlSignal from './ControlSignal';
import { Signals } from './Signal';

export default class Gain extends AudioMod {
  gain: GainNode<AudioContext>|null = null;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'gain');
  }

  getOutputs(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    const signal = inputSignals[PlugPosition.NORTH];
    if (signal instanceof AudioSignal) {
      if (this.audioContext) {
        if (!this.gain) {
          this.gain = this.audioContext.createGain();
          this.gain.gain.value = this.gain.gain.defaultValue;
        }
        signal.node.connect(this.gain);
        outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.gain);
      }
    } else if (signal instanceof BrokenAudioSignal) {
      signal.node.disconnect();
      // Transmit BrokenAudioSignal as it
      outputSignals[PlugPosition.SOUTH] = signal;
    }

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal && this.gain) {
      this.gain.gain.value = controlSignal.value;
      // this.gain.gain.value = value * this.gain.gain.maxValue / this.gain.gain.maxValue;
    }

    return outputSignals;
  }
}
