import { Reverb as ToneReverb } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class Reverb extends EffectMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT, PlugType.CTRLIN], 'reverb');
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneReverb({ decay: 1.5 });
  }

  protected override mapControl(plugPosition: number, value: number): void {
    const node = this.effectNode as ToneReverb;
    if (plugPosition === PlugPosition.EAST) {
      node.decay = value * 10; // map 0–1 → 0–10 s
    } else if (plugPosition === PlugPosition.WEST) {
      node.wet.value = value;
    }
  }
}
