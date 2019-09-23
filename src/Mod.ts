import Konva from 'konva';
import AbstractMod from './AbstractMod';
import { Signals } from './Signal';

export default class Mod extends AbstractMod {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  draw(group:Konva.Group): void {
    // Doing nothing by default
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getOutputs(diffInputSignals: Signals): Signals {
    return [null, null, null, null];
  }
}
