import Konva from 'konva';
import { Waveform as ToneWaveform } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';
import Signals from '../core/Signals';

export default class Oscilloscope extends EffectMod {
  private waveformLine: Konva.Line | null = null;

  private animationFrameId: number | null = null;

  /** Number of samples drawn per frame — controls horizontal scale. Range [8, 256]. */
  private windowSize: number = 128;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT], 'scope', 2);
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneWaveform(2048);
  }

  override onSignalChanged(inputSignals: Signals): Signals {
    const eastSignal = inputSignals[PlugPosition.EAST];
    if (eastSignal instanceof ControlSignal) {
      // Log scale [16, 2048]: knob left = zoomed in, knob right = zoomed out.
      // 16 × 2^(value × 7) distributes evenly across zoom levels.
      this.windowSize = Math.round(16 * Math.pow(2, eastSignal.value * 7));
    }
    return super.onSignalChanged(inputSignals);
  }

  /**
   * Find the first rising zero-crossing in the buffer, leaving at least windowSize
   * samples after the index. Returns 0 as fallback when no crossing is found.
   */
  private findTriggerIndex(data: Float32Array): number {
    const searchLimit = data.length - this.windowSize;
    for (let i = 1; i < searchLimit; i += 1) {
      if (data[i - 1] < 0 && data[i] >= 0) {
        return i;
      }
    }
    return 0;
  }

  draw(group: Konva.Group): void {
    const w = group.width();
    const h = group.height();
    // padX: border strokeWidth (5px) + plug line stroke (5px). padY: same.
    const padX = 10;
    const padY = 10;
    const dw = w - 2 * padX;
    const dh = h - 2 * padY;
    const midY = padY + dh / 2;

    group.add(new Konva.Rect({
      x: padX,
      y: padY,
      width: dw,
      height: dh,
      fill: '#111',
    }));

    group.add(new Konva.Line({
      points: [padX, midY, padX + dw, midY],
      stroke: '#333',
      strokeWidth: 1,
      listening: false,
    }));

    this.waveformLine = new Konva.Line({
      points: [],
      stroke: '#00ff88',
      strokeWidth: 1.5,
      listening: false,
    });
    group.add(this.waveformLine);

    this.startAnimation(group);
  }

  private startAnimation(group: Konva.Group): void {
    const w = group.width();
    const h = group.height();
    const padX = 10;
    const padY = 10;
    const dw = w - 2 * padX;
    const dh = h - 2 * padY;
    const midY = padY + dh / 2;

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (!this.effectNode || !this.waveformLine) return;

      const data = (this.effectNode as ToneWaveform).getValue();
      const triggerIdx = this.findTriggerIndex(data);
      const windowSize = this.windowSize;
      const points: number[] = [];

      for (let i = 0; i < windowSize; i += 1) {
        points.push(padX + (i / (windowSize - 1)) * dw);
        points.push(midY - data[triggerIdx + i] * (dh / 2 - 2));
      }

      this.waveformLine.points(points);
      group.getLayer()?.batchDraw();
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  protected override onSnatched(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    super.onSnatched();
  }
}
