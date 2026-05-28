import { Chorus as ToneChorus } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class Flanger extends EffectMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'flanger');
  }

  protected createEffectNode(): ToneAudioNode {
    const node = new ToneChorus(0.5, 3.5, 0.5).start();
    node.feedback.value = 0.4;
    return node;
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      (this.effectNode as ToneChorus).frequency.value = value * 10;
    }
  }
}
