import { Chorus as ToneChorus } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class Chorus extends EffectMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'chorus');
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneChorus(1.5, 3.5, 0.7).start();
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      (this.effectNode as ToneChorus).frequency.value = value * 10;
    }
  }
}
