import type { ugen } from 'gibberish-dsp';
import Gibberish from 'gibberish-dsp';
import AudioMod from '../core/AudioMod';
import Signals from '../core/Signals';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import AudioSignal from '../core/AudioSignal';
import BrokenAudioSignal from '../core/BrokenAudioSignal';
import ControlSignal from '../core/ControlSignal';

export default class Tremolo extends AudioMod {
  node: ugen | null = null;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'tremolo');
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    const inputSignal = inputSignals[PlugPosition.NORTH];

    if (inputSignal instanceof AudioSignal && inputSignal.node) {
      this.node = Gibberish.fx.Tremolo({
        input: inputSignal.node,
        frequency: 8,
        amount: 1,
      });

      outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);
    } else if (inputSignal instanceof BrokenAudioSignal) {
      outputSignals[PlugPosition.SOUTH] = new BrokenAudioSignal(this.node);
      this.node = null;
    }

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal && this.node) {
      this.node.frequency = controlSignal.value * 10;
    }

    return outputSignals;
  }
}
