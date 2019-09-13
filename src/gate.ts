import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';

export default class Gate extends Mod {
  output: any;

  constructor() {
    super();

    this.configure('gate', 1, 1, [PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  getOutput(plugPosition: number): any {
    return this.output;
  }

  wire(audioContext:AudioContext): void {
    this.output = this.getInput(PlugPosition.NORTH);
  }

  unwire(audioContext:AudioContext): void {
    this.output = null;
  }
}
