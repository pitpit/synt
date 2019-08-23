import Mod from './mod';
import IO from './io';

export default class Note extends Mod {
  constructor(x:number = 0, y:number = 0) {
    super(x, y, 1, 1, [IO.NULL, IO.NULL, IO.OUT]);
  }
}
