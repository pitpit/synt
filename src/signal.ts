interface Signal {}

// TODO should we have a class instead to predefine an array of empty Signal
interface Signals {
  [plugPosition: number]: Signal|null;
}

class ControlSignal implements Signal {
  callback: Function;
  constructor(callback: Function) {
    this.callback = callback;
  }
}

import { AudioContext, IAudioNode as AudioNode } from 'standardized-audio-context';

class AudioSignal implements Signal {
  node: AudioNode<AudioContext>;
  constructor(node: AudioNode<AudioContext>) {
    this.node = node;
  }
}

class BrokenAudioSignal implements Signal {
  node: AudioNode<AudioContext>;
  constructor(previous: AudioSignal) {
    this.node = previous.node;
  }
}

export { Signal, AudioSignal, ControlSignal, BrokenAudioSignal, Signals };
