import Mod from './mod';
import ioType from './ioType';

export default class Note extends Mod {
  constructor() {
    super(1, 1, [ioType.NULL, ioType.NULL, ioType.OUT]);
  }
}
