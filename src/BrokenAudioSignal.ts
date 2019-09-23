import { AudioContext, IAudioNode as AudioNode } from 'standardized-audio-context';
import { Signal } from './Signal';

export default class BrokenAudioSignal implements Signal {
  node: AudioNode<AudioContext>;

  constructor(node: AudioNode<AudioContext>) {
    this.node = node;
  }
}
