import { Panner as TonePanner } from 'tone';
import AudioMod from '../core/AudioMod';
import Signals from '../core/Signals';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import AudioSignal from '../core/AudioSignal';
import BrokenAudioSignal from '../core/BrokenAudioSignal';
import ControlSignal from '../core/ControlSignal';

export default class Panner extends AudioMod {
  node: TonePanner | null = null;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'pan');
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    const inputSignal = inputSignals[PlugPosition.NORTH];

    if (inputSignal instanceof AudioSignal && inputSignal.node) {
      this.node?.dispose();
      this.node = new TonePanner(0);
      inputSignal.node.connect(this.node);
      outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);
    } else if (inputSignal instanceof BrokenAudioSignal) {
      outputSignals[PlugPosition.SOUTH] = new BrokenAudioSignal(this.node);
      this.node = null;
      queueMicrotask(() => { this.node?.dispose(); });
    }

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal && this.node) {
      // Knob outputs 0–1; map to Panner's -1 (left) to +1 (right)
      this.node.pan.value = controlSignal.value * 2 - 1;
    }

    return outputSignals;
  }
}
