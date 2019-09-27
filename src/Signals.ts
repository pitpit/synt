import { Signal } from './Signal';

// TODO should we have a class instead to predefine an array of empty Signal
export default class Signals {
  [plugPosition: number]: Signal|null;

  /**
   * Iterate over signals.
   */
  forEach(callback: Function) {
    this.forEach((signal: Signal, plugPosition: number) => {
      callback(signal, plugPosition);
    });
  }
}
