// import { AudioContext, IAudioNode as AudioNode } from 'standardized-audio-context';
import { Signal } from './Signal';

export default class BrokenAudioSignal implements Signal {
  // node: AudioNode<AudioContext>;
  node: any;

  constructor(node: any) {
    this.node = node;
  }
}
