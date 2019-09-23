import { Signal } from './Signal';

export default class ControlSignal implements Signal {
  value: number;

  constructor(value: number) {
    this.value = value;
  }
}
