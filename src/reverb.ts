import Mod from './mod';
import ioType from './ioType';

export default class Reverb extends Mod {
  constructor() {
    super(1, 1, [ioType.IN, ioType.NULL, ioType.OUT]);
    this.label = 'reverb';
  }
}
