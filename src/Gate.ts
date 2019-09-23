import Mod from './Mod';
import PlugType from './PlugType';
import { Signals } from './Signal';
import PlugPosition from './PlugPosition';

export default class Gate extends Mod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  getOutputs(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    outputSignals[PlugPosition.SOUTH] = inputSignals[PlugPosition.NORTH];

    return outputSignals;
  }
}
