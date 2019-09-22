import AudioMod from './AudioMod';
import PlugType from './PlugType';
import { Signals, AudioSignal, ControlSignal } from './Signal';
import PlugPosition from './PlugPosition';
import { AudioContext, OscillatorNode, GainNode } from 'standardized-audio-context';

export default class Oscillator extends AudioMod {
  oscillator: OscillatorNode<AudioContext>|null = null;

  constructor() {
    super();
    this.configure('osc', 1, 1, [PlugType.NULL, PlugType.CTRLIN, PlugType.OUT]);
  }

  getOutputs(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    if (this.audioContext) {
      if (!this.oscillator) {
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.value = 440;
        this.oscillator.start(0);
      }
      outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.oscillator);
    }

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (
      controlSignal instanceof ControlSignal
      && this.oscillator
    ) {
      this.oscillator.frequency.value = controlSignal.value * 1400 + 40;
    }
    return outputSignals;
  }
}
