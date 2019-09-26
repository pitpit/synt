import Mod from './Mod';
import PlugType from './PlugType';
import { Signals, Signal } from './Signal';
import PlugPosition from './PlugPosition';

export default class Gate extends Mod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  // onSignalBroken(plugPosition: number, inputSignal: Signal): void {
  //   // if (plugPosition === PlugPosition.NORTH) {
  //   //   inputSignal.node.disconnect();
  //   // }
  // }

  onSignalChanged(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    const inputSignal = inputSignals[PlugPosition.NORTH];
    outputSignals[PlugPosition.SOUTH] = inputSignal || null;
    return outputSignals;
  }
}
