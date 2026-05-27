import { Filter as ToneFilter } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class HighPassFilter extends EffectMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'high-pass');
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneFilter(1000, 'highpass');
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      (this.effectNode as ToneFilter).frequency.value = value * 4000; // map 0–1 → 0–4000 Hz
    }
  }
}
