import { Phaser as TonePhaser } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';

export default class Phaser extends EffectMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'phaser');
  }

  protected createEffectNode(): ToneAudioNode {
    return new TonePhaser({ frequency: 0.5, octaves: 3, baseFrequency: 350 });
  }

  protected override mapControl(plugPosition: number, value: number): void {
    if (plugPosition === PlugPosition.EAST) {
      (this.effectNode as TonePhaser).frequency.value = value * 10;
    }
  }
}
