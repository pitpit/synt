import { Signal } from './Signal';

export default class ControlSignal implements Signal {
  value: number;

  constructor(value: number) {
    this.value = value;
  }

  eq(signal: Signal): boolean {
    return (signal instanceof ControlSignal && signal.value === this.value);
  }
}
