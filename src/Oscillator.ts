// import { AudioContext, OscillatorNode, TOscillatorType } from 'standardized-audio-context';
import AudioMod from './AudioMod';
import PlugType from './PlugType';
import { Signals } from './Signal';
import ControlSignal from './ControlSignal';
import PlugPosition from './PlugPosition';
import AudioSignal from './AudioSignal';

export default abstract class Oscillator extends AudioMod {
  oscillator: any|null = null;

  function: Function|null = null;

  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.OUT], 'osc');
  }

  getOutputs(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    if (!this.oscillator && this.function) {
      console.log('construct')
      this.oscillator = this.function({ frequency: 220 });
    }
    console.log('output')
    outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.oscillator);


    // const controlSignal = inputSignals[PlugPosition.EAST];
    // if (controlSignal instanceof ControlSignal && this.oscillator) {
    //   this.oscillator.frequency = controlSignal.value * 400;
    // }
    return outputSignals;
  }
}
