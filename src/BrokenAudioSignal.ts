import type { ugen } from 'gibberish-dsp';
import { Signal } from './Signal';

export default class BrokenAudioSignal implements Signal {
  node: ugen | null;

  constructor(node: ugen | null) {
    this.node = node;
  }

  eq(signal: Signal): boolean {
    return (signal instanceof BrokenAudioSignal && signal.node === this.node);
  }
}
