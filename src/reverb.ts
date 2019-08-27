import Mod from './mod';
import IoType from './ioType';

export default class Reverb extends Mod {
  constructor() {
    super(1, 1, [IoType.IN, IoType.NULL, IoType.OUT]);
    this.label = 'reverb';
  }
}
