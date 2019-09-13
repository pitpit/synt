import Mod from './mod';
import PlugType from './plugType';
import Cardinal from './cardinal';

export default class Gate extends Mod {
  output: any;

  constructor() {
    super();

    this.configure('gate', 1, 1, [PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  getOutput(cardinal: number): any {
    return this.output;
  }

  wire(audioContext:AudioContext): void {
    this.output = this.getInput(Cardinal.NORTH);
  }

  unwire(audioContext:AudioContext): void {
    this.output = null;
  }
}
