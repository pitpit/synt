import Mod from './mod';
import PlugType from './plug-type';
import { Signals, AudioSignal, BrokenAudioSignal} from './signal';
import PlugPosition from './plug-position';

export default class Gate extends Mod {

  constructor() {
    super();

    this.configure('', 1, 1, [PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  process(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    outputSignals[PlugPosition.SOUTH] = inputSignals[PlugPosition.NORTH];

    return outputSignals;
  }
}
