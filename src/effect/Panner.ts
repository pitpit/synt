import { Panner as TonePanner } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class Panner extends EffectMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'pan');
  }

  protected createEffectNode(): ToneAudioNode {
    return new TonePanner(0);
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      // Knob outputs 0–1; map to Panner's -1 (left) to +1 (right)
      (this.effectNode as TonePanner).pan.value = value * 2 - 1;
    }
  }
}
