// import { AudioContext, OscillatorNode, TOscillatorType } from 'standardized-audio-context';
import AudioMod from './AudioMod';
import PlugType from './PlugType';
import { Signals } from './Signal';
import ControlSignal from './ControlSignal';
import PlugPosition from './PlugPosition';
import AudioSignal from './AudioSignal';

export default abstract class Oscillator extends AudioMod {
  oscillator: any;

  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.oscillator);


    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal && this.oscillator) {
      this.oscillator.frequency = controlSignal.value * 400;
    }
    return outputSignals;
  }
}
