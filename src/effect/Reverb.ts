import { Reverb as ToneReverb } from 'tone';
import AudioMod from '../core/AudioMod';
import Signals from '../core/Signals';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import AudioSignal from '../core/AudioSignal';
import BrokenAudioSignal from '../core/BrokenAudioSignal';
import ControlSignal from '../core/ControlSignal';

export default class Reverb extends AudioMod {
  node: ToneReverb | null = null;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT, PlugType.CTRLIN], 'reverb');
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    const inputSignal = inputSignals[PlugPosition.NORTH];

    if (inputSignal instanceof AudioSignal && inputSignal.node) {
      this.node?.dispose();
      this.node = new ToneReverb({ decay: 1.5 });
      inputSignal.node.connect(this.node);
      outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.node);
    } else if (inputSignal instanceof BrokenAudioSignal) {
      outputSignals[PlugPosition.SOUTH] = new BrokenAudioSignal(this.node);
      const nodeToDispose = this.node;
      this.node = null;
      queueMicrotask(() => { nodeToDispose?.dispose(); });
    }

    const decaySignal = inputSignals[PlugPosition.EAST];
    if (decaySignal instanceof ControlSignal && this.node) {
      this.node.decay = decaySignal.value * 10; // map 0–1 → 0–10 s
    }

    const wetSignal = inputSignals[PlugPosition.WEST];
    if (wetSignal instanceof ControlSignal && this.node) {
      this.node.wet.value = wetSignal.value;
    }

    return outputSignals;
  }
}
