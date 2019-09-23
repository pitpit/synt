import { AudioContext, OscillatorNode, TOscillatorType } from 'standardized-audio-context';
import AudioMod from './AudioMod';
import PlugType from './PlugType';
import { Signals } from './Signal';
import AudioSignal from './AudioSignal';
import ControlSignal from './ControlSignal';
import PlugPosition from './PlugPosition';

export default abstract class Oscillator extends AudioMod {
  oscillator: OscillatorNode<AudioContext>|null = null;

  abstract type: TOscillatorType;

  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');
  }

  getOutputs(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    if (this.audioContext) {
      if (!this.oscillator) {
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = this.type;
        this.oscillator.frequency.value = 440;
        this.oscillator.start(0);
      }
      outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.oscillator);
    }

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal && this.oscillator) {
      this.oscillator.frequency.value = controlSignal.value * 1400 + 40;
    }
    return outputSignals;
  }
}
