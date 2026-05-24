import Mod from '../core/Mod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';
import Signals from '../core/Signals';

const NUM_STEPS = 4;
const MIN_BPM = 40;
const MAX_BPM = 400;

export default class Arpeggiator extends Mod {
  stepValues: number[] = [0.3, 0.45, 0.55, 0.45];

  stepIndex: number = 0;

  bpm: number = 120;

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
    const interval = Math.round(60000 / this.bpm);
    const tick = () => {
      this.pushOutput(PlugPosition.WEST, new ControlSignal(this.stepValues[this.stepIndex]));
      this.stepIndex = (this.stepIndex + 1) % NUM_STEPS;
    };
    if (fireImmediately) {
      tick();
    }
    this.timerId = setInterval(tick, interval);
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const ctrlSignal = inputSignals[PlugPosition.EAST];
    if (ctrlSignal instanceof ControlSignal) {
      this.bpm = MIN_BPM + ctrlSignal.value * (MAX_BPM - MIN_BPM);
      console.log('ctrlSignal.value:', ctrlSignal.value, 'bpm:', this.bpm);
      this.startTimer(true);
    }
    return [null, null, null, null];
  }
}
