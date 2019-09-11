import Mod from './mod';
import IoType from './ioType';

export default class Note extends Mod {
  setup() {
    this.configure('note', 1, 1, [IoType.NULL, IoType.NULL, IoType.OUT]);
  }
}
