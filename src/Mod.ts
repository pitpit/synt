import Konva from 'konva';
import AbstractMod from './AbstractMod';
import { Signals, Signal } from './Signal';

export default class Mod extends AbstractMod {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  draw(group:Konva.Group): void {
    // Do nothing by default
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSignalChanged(inputSignals: Signals): Signals {
    return [null, null, null, null];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSignalBroken(plugPosition: number, inputSignal: Signal): void {
    // Do nothing by default
  }
}
