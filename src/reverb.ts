import Mod from './mod';
import PlugType from './plug-type';
import PlugPosition from './plug-position';

export default class Reverb extends Mod {
  output: any;

  constructor() {
    super();

    this.configure('reverb', 1, 1, [PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  getOutput(plugPosition: number): any {
    return this.output;
  }

  onLinked(audioContext:AudioContext): void {
    this.output = this.getInput(PlugPosition.NORTH);
  }

  onUnlinked(audioContext:AudioContext): void {
    this.output = null;
  }
}
