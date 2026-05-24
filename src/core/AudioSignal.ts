import type { ToneAudioNode } from 'tone';
import { Signal } from './Signal';

export default class AudioSignal implements Signal {
  node: ToneAudioNode | null;

  constructor(node: ToneAudioNode | null) {
    this.node = node;
  }

  eq(signal: Signal): boolean {
    return (signal instanceof AudioSignal && signal.node === this.node);
  }
}
