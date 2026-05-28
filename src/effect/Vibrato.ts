import { Vibrato as ToneVibrato } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class Vibrato extends EffectMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'vibrato');
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneVibrato(5, 0.5);
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      (this.effectNode as ToneVibrato).frequency.value = value * 10;
    }
  }
}
