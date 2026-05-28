import { Gain as ToneGain, getDestination } from 'tone';
import Mod from './Mod';
import Signals from './Signals';
import ControlSignal from './ControlSignal';
import { HasAudioInput } from './AudioInterfaces';

export default abstract class SinkMod extends Mod implements HasAudioInput {
  private gainNode: ToneGain | null = null;

  protected gain: number = 0.5;

  get audioInputNode(): ToneGain {
    if (!this.gainNode) {
      this.gainNode = new ToneGain(this.gain);
      this.gainNode.connect(getDestination());
    }
    return this.gainNode;
  }

  /**
   * Override to apply a CV signal value.
   * Called automatically from onSignalChanged for each non-null ControlSignal.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected mapControl(_plugPosition: number, _value: number): void {
    // Do nothing by default
  }

  override onSignalChanged(inputSignals: Signals): Signals {
    for (let i = 0; i < 4; i += 1) {
      const signal = inputSignals[i];
      if (signal instanceof ControlSignal) {
        this.mapControl(i, signal.value);
      }
    }
    return [null, null, null, null];
  }

  protected override onSnatched(): void {
    if (this.gainNode) {
      this.gainNode.dispose();
      this.gainNode = null;
    }
  }
}
