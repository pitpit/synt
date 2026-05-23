import { Signal } from './Signal';

// TODO should we have a class instead to predefine an array of empty Signal
export default class Signals {
  [plugPosition: number]: Signal|null;

  /**
   * Iterate over signals.
   */
  forEach(callback: (signal: Signal|null, plugPosition: number) => void) {
    this.forEach((signal: Signal|null, plugPosition: number) => {
      callback(signal, plugPosition);
    });
  }
}
