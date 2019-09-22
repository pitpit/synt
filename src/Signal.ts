
import { AudioContext, IAudioNode as AudioNode } from 'standardized-audio-context';

interface Signal {}

// TODO should we have a class instead to predefine an array of empty Signal
interface Signals {
  [plugPosition: number]: Signal|null;
}

class ControlSignal implements Signal {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
}

class AudioSignal implements Signal {
  node: AudioNode<AudioContext>;
  constructor(node: AudioNode<AudioContext>) {
    this.node = node;
  }
}

class BrokenAudioSignal implements Signal {
  node: AudioNode<AudioContext>;
  constructor(node: AudioNode<AudioContext>) {
    this.node = node;
  }
}

export { Signal, AudioSignal, ControlSignal, BrokenAudioSignal, Signals };
