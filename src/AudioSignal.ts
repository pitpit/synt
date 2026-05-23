import type { ugen } from 'gibberish-dsp';
import { Signal } from './Signal';

export default class AudioSignal implements Signal {
  node: ugen | null;

  constructor(node: ugen | null) {
    this.node = node;
  }

  eq(signal: Signal): boolean {
    return (signal instanceof AudioSignal && signal.node === this.node);
  }
}
