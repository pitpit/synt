import Mod from './mod';
import IoType from './ioType';

export default class Reverb extends Mod {
  setup() {
    this.configure('reverb', 1, 1, [IoType.IN, IoType.NULL, IoType.OUT]);
  }
}
