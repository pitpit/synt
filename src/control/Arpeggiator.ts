import Mod from '../core/Mod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';
import Signals from '../core/Signals';

const NUM_STEPS = 4;
const MIN_CLOCK_INTERVAL_MS = 150;
const MAX_CLOCK_INTERVAL_MS = 1500;

export default class Arpeggiator extends Mod {
  stepValues: number[] = [0.3, 0.45, 0.55, 0.45];

  stepIndex: number = 0;

  clock: number = 500;

  timerId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this.configure([PlugType.NULL, PlugType.CTRLIN, PlugType.NULL, PlugType.CTRLOUT], 'arp');
    this.startTimer();
  }

  private startTimer(fireImmediately = false): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
    }
    const tick = () => {
      this.pushOutput(PlugPosition.WEST, new ControlSignal(this.stepValues[this.stepIndex]));
      this.stepIndex = (this.stepIndex + 1) % NUM_STEPS;
    };
    if (fireImmediately) {
      tick();
    }
    this.timerId = setInterval(tick, this.clock);
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const ctrlSignal = inputSignals[PlugPosition.EAST];
    if (ctrlSignal instanceof ControlSignal) {
      this.clock = Math.round(MAX_CLOCK_INTERVAL_MS - ctrlSignal.value * (MAX_CLOCK_INTERVAL_MS - MIN_CLOCK_INTERVAL_MS));
      this.startTimer();
    }
    return [null, null, null, null];
  }
}
