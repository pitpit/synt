import Mod from './mod';
import IoType from './ioType';

export default class Note extends Mod {
  constructor() {
    super();
    this.configure('note', 1, 1, [IoType.NULL, IoType.NULL, IoType.OUT]);
  }
}
