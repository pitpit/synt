import { Signal } from './Signal';

export default class AudioSignal implements Signal {
  node: any;

  constructor(node: any) {
    this.node = node;
  }
}
