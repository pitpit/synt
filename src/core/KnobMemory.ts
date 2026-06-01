import Mod from './Mod';
import PlugPosition from './PlugPosition';
import PlugType from './PlugType';
import { Signal } from './Signal';

export interface KnobMemoryConsumer {
  knobMemory: KnobMemory | null;
}

export function isKnobMemoryConsumer(x: unknown): x is KnobMemoryConsumer {
  return typeof x === 'object' && x !== null && 'knobMemory' in x;
}

export default class KnobMemory {
  private signals = new Map<Mod, (Signal | null)[]>();

  private listeners = new Map<Mod, (plugPosition: number, inputSignal: Signal | null) => void>();

  observe(mod: Mod): void {
    const handler = (plugPosition: number, inputSignal: Signal | null) => {
      if (inputSignal === null) return;
      let stored = this.signals.get(mod);
      if (!stored) {
        stored = [null, null, null, null];
        this.signals.set(mod, stored);
      }
      stored[plugPosition] = inputSignal;
    };
    this.listeners.set(mod, handler);
    mod.events.on('input', handler);
  }

  unobserve(mod: Mod): void {
    const handler = this.listeners.get(mod);
    if (handler) {
      mod.events.off('input', handler);
      this.listeners.delete(mod);
    }
    this.signals.delete(mod);
  }

  get(mod: Mod, plugPosition: number): Signal | null {
    const plug = mod.plugs.getPlug(plugPosition);
    if (plug.type === PlugType.CTRLIN) {
      const ctrloutPlug = mod.plugs.items.find((p) => p.type === PlugType.CTRLOUT);
      if (ctrloutPlug) {
        // Pass-through mod (e.g. ControlMeter): only recall if there is a downstream connection.
        if (ctrloutPlug.mod) {
          const ctrloutPlugPosition = mod.plugs.items.indexOf(ctrloutPlug);
          return this.get(ctrloutPlug.mod, PlugPosition.opposite(ctrloutPlugPosition));
        }
        return null;
      }
      // Terminal mod (e.g. Speaker, Oscillator): no CTRLOUT, use stored signal.
    }
    return this.signals.get(mod)?.[plugPosition] ?? null;
  }
}
