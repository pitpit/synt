import Konva from 'konva';
import Mod from '../core/Mod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';
import type Signals from '../core/Signals';

const MIN_FREQ = 0.5;
const MAX_FREQ = 10;

export default class Clock extends Mod {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private tickValue: number = 0;

  private frequencyHz: number = 2;

  constructor() {
    super();
    this.configure(
      [PlugType.NULL, PlugType.CTRLIN, PlugType.CLKOUT, PlugType.NULL],
      'clk',
    );
  }

  private startClock(): void {
    this.stopClock();
    this.intervalId = setInterval(() => {
      this.tickValue = this.tickValue === 0 ? 1 : 0;
      this.pushOutput(PlugPosition.SOUTH, new ControlSignal(this.tickValue));
    }, 1000 / this.frequencyHz);
  }

  private stopClock(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  override onSignalChanged(inputSignals: Signals): Signals {
    const rateSignal = inputSignals[PlugPosition.EAST];
    if (rateSignal instanceof ControlSignal) {
      this.frequencyHz = MIN_FREQ + rateSignal.value * (MAX_FREQ - MIN_FREQ);
      if (this.intervalId !== null) {
        this.startClock();
      }
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

  override draw(group: Konva.Group): void {
    group.add(new Konva.Text({
      x: 0,
      y: group.height() / 2 - 7,
      width: group.width(),
      text: 'CLK',
      fontSize: 13,
      fontStyle: 'bold',
      fill: 'cyan',
      align: 'center',
    }));
  }
}
