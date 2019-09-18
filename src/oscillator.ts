import Mod from './mod';
import PlugType from './plug-type';
import { Signals, AudioSignal, ControlSignal } from './signal';
import PlugPosition from './plug-position';
import { AudioContext, OscillatorNode, GainNode } from 'standardized-audio-context';

export default class Oscillator extends Mod {
  oscillator: OscillatorNode<AudioContext>|null = null;

  constructor() {
    super();

    this.configure('osc', 1, 1, [PlugType.NULL, PlugType.CTRLIN, PlugType.OUT]);
  }

  process(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    if (this.audioContext) {
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = 440;
      this.oscillator.start(0);
      outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.oscillator);
    }

    outputSignals[PlugPosition.EAST] = new ControlSignal((value: number) => {
      if (this.oscillator) {
        this.oscillator.frequency.value = value * 1400 + 40;
      }
    });

    return outputSignals;
  }
}
