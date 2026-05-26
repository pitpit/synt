import { Tremolo as ToneTremolo } from 'tone';
import AudioMod from '../core/AudioMod';
import Signals from '../core/Signals';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import AudioSignal from '../core/AudioSignal';
import BrokenAudioSignal from '../core/BrokenAudioSignal';
import ControlSignal from '../core/ControlSignal';

export default class Tremolo extends AudioMod {
  node: ToneTremolo | null = null;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'tremolo');
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    const inputSignal = inputSignals[PlugPosition.NORTH];

    if (inputSignal instanceof AudioSignal && inputSignal.node) {
      this.node?.dispose();
      this.node = new ToneTremolo(8, 1).start();
      inputSignal.node.connect(this.node);
      outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);
    } else if (inputSignal instanceof BrokenAudioSignal) {
      outputSignals[PlugPosition.SOUTH] = new BrokenAudioSignal(this.node);
      queueMicrotask(() => { this.node?.dispose(); });
    }

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal && this.node && !this.node.disposed) {
      this.node.frequency.value = controlSignal.value * 10;
    }

    return outputSignals;
  }
}
