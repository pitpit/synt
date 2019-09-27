import Gibberish from 'gibberish-dsp';
import AudioMod from './AudioMod';
import Signals from './Signals';
import PlugType from './PlugType';
import PlugPosition from './PlugPosition';
import AudioSignal from './AudioSignal';
import BrokenAudioSignal from './BrokenAudioSignal';
import ControlSignal from './ControlSignal';

export default class Tremolo extends AudioMod {
  node: any;

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
