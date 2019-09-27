import { Signal } from './Signal';

export default class BrokenAudioSignal implements Signal {
  node: any;

  constructor(node: any) {
    this.node = node;
  }

  eq(signal: Signal): boolean {
    return (signal instanceof BrokenAudioSignal && signal.node === this.node);
  }
}
