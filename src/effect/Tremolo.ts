import { Tremolo as ToneTremolo } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class Tremolo extends EffectMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'tremolo');
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneTremolo(8, 1).start();
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      (this.effectNode as ToneTremolo).frequency.value = value * 10;
    }
  }
}
