import Mod from '../core/Mod';
import PlugType from '../core/PlugType';
import Signals from '../core/Signals';
import PlugPosition from '../core/PlugPosition';

export default class Gate extends Mod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    const inputSignal = inputSignals[PlugPosition.NORTH];
    outputSignals[PlugPosition.SOUTH] = inputSignal || null;
    return outputSignals;
  }
}
