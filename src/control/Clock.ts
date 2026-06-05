import Mod from '../core/Mod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';
import type Signals from '../core/Signals';

const MIN_FREQ = 0.5;
const MAX_FREQ = 10;

export default class Clock extends Mod {
  private intervalId: ReturnType<typeof setTimeout> | null = null;

  private tickValue: number = 0;

  private frequencyHz: number = 2;

  constructor() {
    super();
    this.configure(
      [PlugType.NULL, PlugType.CTRLIN, PlugType.CLKOUT, PlugType.NULL],
      'clk',
    );
  }

  private scheduleNext(): void {
    this.intervalId = setTimeout(() => {
      if (this.intervalId === null) return;
      this.tickValue = this.tickValue === 0 ? 1 : 0;
      this.pushOutput(PlugPosition.SOUTH, new ControlSignal(this.tickValue));
      this.scheduleNext();
    }, 1000 / this.frequencyHz);
  }

  private startClock(): void {
    this.stopClock();
    this.scheduleNext();
  }

  private stopClock(): void {
    if (this.intervalId !== null) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  override onSignalChanged(inputSignals: Signals): Signals {
    const rateSignal = inputSignals[PlugPosition.EAST];
    if (rateSignal instanceof ControlSignal) {
      this.frequencyHz = MIN_FREQ + rateSignal.value * (MAX_FREQ - MIN_FREQ);
    }
    return Array(this.plugs.items.length).fill(null) as Signals;
  }

  protected override onLinked(plugPosition: number): void {
    if (plugPosition === PlugPosition.SOUTH) {
      this.startClock();
    }
  }

  protected override onUnlinked(plugPosition: number): void {
    if (plugPosition === PlugPosition.SOUTH) {
      this.stopClock();
    }
  }

  protected override onSnatched(): void {
    this.stopClock();
  }
}
