import type { ToneAudioNode } from 'tone';
import Mod from './Mod';
import PlugPosition from './PlugPosition';
import Signals from './Signals';
import ControlSignal from './ControlSignal';
import { hasAudioInput, HasAudioInput, HasAudioOutput } from './AudioInterfaces';

export default abstract class EffectMod extends Mod implements HasAudioInput, HasAudioOutput {
  protected effectNode: ToneAudioNode | null = null;

  protected abstract createEffectNode(): ToneAudioNode;

  protected ensureEffectNode(): ToneAudioNode {
    if (!this.effectNode) {
      this.effectNode = this.createEffectNode();
    }
    return this.effectNode;
  }

  get node(): ToneAudioNode | null {
    return this.effectNode;
  }

  get audioInputNode(): ToneAudioNode {
    return this.ensureEffectNode();
  }

  get audioOutputNode(): ToneAudioNode {
    return this.ensureEffectNode();
  }

  /**
   * Override to apply a CV signal value to the Tone.js effect node.
   * Called automatically from onSignalChanged for each non-null ControlSignal.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected mapControl(_plugPosition: number, _value: number): void {
    // Do nothing by default
  }

  override onSignalChanged(inputSignals: Signals): Signals {
    for (let i = 0; i < 4; i += 1) {
      const signal = inputSignals[i];
      if (signal instanceof ControlSignal && this.effectNode) {
        this.mapControl(i, signal.value);
      }
    }
    return [null, null, null, null];
  }

  protected override onLinked(plugPosition: number, target: Mod): void {
    // Output side (SOUTH) initiates the Tone.js connection downstream
    if (plugPosition === PlugPosition.SOUTH && hasAudioInput(target)) {
      this.ensureEffectNode().connect(target.audioInputNode);
    }
  }

  protected override onUnlinked(plugPosition: number, prev: Mod): void {
    if (plugPosition === PlugPosition.SOUTH && hasAudioInput(prev) && this.effectNode) {
      try {
        this.effectNode.disconnect(prev.audioInputNode);
      } catch {
        // Tone.js throws if already disconnected — safe to ignore
      }
    }
    if (plugPosition === PlugPosition.NORTH && this.effectNode) {
      // Belt-and-suspenders: ensure the upstream node is disconnected from us
      // (the source side handles this via its own onUnlinked, but Tone.js is idempotent)
    }
  }

  protected override onSnatched(): void {
    if (this.effectNode) {
      this.effectNode.dispose();
      this.effectNode = null;
    }
  }
}
