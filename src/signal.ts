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

class AudioSignal implements Signal {
  node: AudioNode;
  constructor(node: AudioNode) {
    this.node = node;
  }
}

class BrokenAudioSignal implements Signal {
  node: AudioNode;
  constructor(previous: AudioSignal) {
    this.node = previous.node;
  }
}

export { Signal, AudioSignal, ControlSignal, BrokenAudioSignal, Signals };
