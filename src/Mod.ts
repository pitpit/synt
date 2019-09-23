import AbstractMod from './AbstractMod';
import { Signals } from './Signal';

export default class Mod extends AbstractMod {
  draw() {
    // Doing nothing
  }

  getOutputs(): Signals {
    return [null, null, null, null];
  }
}
