import { Signal } from './Signal';

export default class AudioSignal implements Signal {
  node: any;

  constructor(node: any) {
    this.node = node;
  }

  eq(signal: Signal): boolean {
    return (signal instanceof AudioSignal && signal.node === this.node);
  }
}
