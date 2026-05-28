import { Gain as ToneGain } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';

export default class Gate extends EffectMod {
  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneGain(1);
  }
}
