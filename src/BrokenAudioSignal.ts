import { Signal } from './Signal';

export default class BrokenAudioSignal implements Signal {
  node: any;

  constructor(node: any) {
    this.node = node;
  }
}
