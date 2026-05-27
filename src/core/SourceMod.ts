import type { ToneAudioNode } from 'tone';
import Mod from './Mod';
import PlugPosition from './PlugPosition';
import Signals from './Signals';
import ControlSignal from './ControlSignal';
import { hasAudioInput, HasAudioOutput } from './AudioInterfaces';

export default abstract class SourceMod extends Mod implements HasAudioOutput {
  protected outputNode: ToneAudioNode | null = null;

  protected abstract createOutputNode(): ToneAudioNode;

  protected ensureOutputNode(): ToneAudioNode {
    if (!this.outputNode) {
      this.outputNode = this.createOutputNode();
    }
    return this.outputNode;
  }

  get audioOutputNode(): ToneAudioNode {
    return this.ensureOutputNode();
  }

  /**
   * Override to apply a CV signal value to the Tone.js output node.
   * Called automatically from onSignalChanged for each non-null ControlSignal.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected mapControl(_plugPosition: number, _value: number): void {
    // Do nothing by default
  }

  override onSignalChanged(inputSignals: Signals): Signals {
    const node = this.ensureOutputNode();
    for (let i = 0; i < 4; i += 1) {
      const signal = inputSignals[i];
      if (signal instanceof ControlSignal) {
        this.mapControl(i, signal.value);
      }
    }
    // Suppress unused-variable lint — node used in subclass mapControl via this.outputNode
    void node;
    return [null, null, null, null];
  }

  protected override onLinked(plugPosition: number, target: Mod): void {
    // Only the output-side (SOUTH) initiates the Tone.js connection
    if (plugPosition === PlugPosition.SOUTH && hasAudioInput(target)) {
      this.ensureOutputNode().connect(target.audioInputNode);
    }
  }

  protected override onUnlinked(plugPosition: number, prev: Mod): void {
    if (plugPosition === PlugPosition.SOUTH && hasAudioInput(prev) && this.outputNode) {
      try {
        this.outputNode.disconnect(prev.audioInputNode);
      } catch {
        // Tone.js throws if the node was already disconnected — safe to ignore
      }
    }
  }

  protected override onSnatched(): void {
    if (this.outputNode) {
      this.outputNode.dispose();
      this.outputNode = null;
    }
  }
}
