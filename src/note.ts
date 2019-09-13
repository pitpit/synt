import Mod from './mod';
import PlugType from './plug-type';

export default class Note extends Mod {
  constructor() {
    super();
    this.configure('note', 1, 1, [PlugType.NULL, PlugType.NULL, PlugType.OUT]);
  }
}
