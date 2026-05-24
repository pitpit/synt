import type { ToneAudioNode } from 'tone';
import { Signal } from './Signal';

export default class BrokenAudioSignal implements Signal {
  node: ToneAudioNode | null;

  constructor(node: ToneAudioNode | null) {
    this.node = node;
  }

  eq(signal: Signal): boolean {
    return (signal instanceof BrokenAudioSignal && signal.node === this.node);
  }
}
