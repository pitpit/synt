import Konva from 'konva';
import { Analyser as ToneAnalyser, Gain as ToneGain } from 'tone';
import type { ToneAudioNode } from 'tone';
import EffectMod from '../core/EffectMod';
import Mod from '../core/Mod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import ControlSignal from '../core/ControlSignal';
import Signals from '../core/Signals';

export default class Oscilloscope extends EffectMod {
  private waveformLineLeft: Konva.Line | null = null;

  private waveformLineRight: Konva.Line | null = null;

  private animationFrameId: number | null = null;

  private _upmixNode: ToneGain | null = null;

  /** Number of samples drawn per frame — controls time window width. Range [16, 2048]. */
  private samples: number = 128;

  /** Amplitude multiplier applied to the waveform. Range [0.1, 10]. */
  private amplitude: number = 1;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT, PlugType.CTRLIN], 'scope', 2);
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneAnalyser({ type: 'waveform', size: 2048, channels: 2 });
  }

  /**
   * Returns a Gain node configured to upmix mono input to stereo, so that a
   * mono oscillator populates both analyser channels (left=white, right=red).
   */
  private ensureUpmixNode(): ToneGain {
    if (!this._upmixNode) {
      this._upmixNode = new ToneGain(1);
      // Force stereo upmixing: 'speakers' interpretation with explicit channelCount=2
      // maps a mono signal equally to both output channels.
      const rawGain = (this._upmixNode as unknown as { input: GainNode }).input;
      if (rawGain) {
        rawGain.channelCount = 2;
        rawGain.channelCountMode = 'explicit';
        rawGain.channelInterpretation = 'speakers';
      }
      this._upmixNode.connect(this.ensureEffectNode());
    }
    return this._upmixNode;
  }

  override get audioInputNode(): ToneAudioNode {
    return this.ensureUpmixNode();
  }

  override onSignalChanged(inputSignals: Signals): Signals {
    const eastSignal = inputSignals[PlugPosition.EAST];
    if (eastSignal instanceof ControlSignal) {
      // Log scale [16, 2048]: knob left = zoomed in, knob right = zoomed out.
      // 16 × 2^(value × 7) distributes evenly across zoom levels.
      this.samples = Math.round(16 * Math.pow(2, eastSignal.value * 7));
    }
    const westSignal = inputSignals[PlugPosition.WEST];
    if (westSignal instanceof ControlSignal) {
      // Log scale [0.1, 10]: knob left = zoomed out, knob right = zoomed in.
      this.amplitude = 0.1 * Math.pow(100, westSignal.value);
    }
    return super.onSignalChanged(inputSignals);
  }

  /**
   * Find the first rising zero-crossing in the buffer, leaving at least `samples`
   * entries after the index. Returns 0 as fallback when no crossing is found.
   */
  private findTriggerIndex(data: Float32Array): number {
    const searchLimit = data.length - this.samples;
    for (let i = 1; i < searchLimit; i += 1) {
      if (data[i - 1] < 0 && data[i] >= 0) {
        return i;
      }
    }
    return 0;
  }

  draw(group: Konva.Group): void {
    this.group = group;
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

    this.waveformLineLeft = new Konva.Line({
      points: [],
      stroke: '#ffffff',
      strokeWidth: 1.5,
      listening: false,
    });
    group.add(this.waveformLineLeft);

    this.waveformLineRight = new Konva.Line({
      points: [],
      stroke: '#ff4444',
      strokeWidth: 1.5,
      listening: false,
    });
    group.add(this.waveformLineRight);

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

    const buildPoints = (data: Float32Array, triggerIdx: number, samples: number): number[] => {
      const points: number[] = [];
      for (let i = 0; i < samples; i += 1) {
        points.push(padX + (i / (samples - 1)) * dw);
        const y = midY - data[triggerIdx + i] * this.amplitude * (dh / 2 - 2);
        points.push(Math.max(padY, Math.min(padY + dh, y)));
      }
      return points;
    };

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (!this.effectNode || !this.waveformLineLeft || !this.waveformLineRight) return;

      const [left, right] = (this.effectNode as ToneAnalyser).getValue() as Float32Array[];
      const samples = this.samples;

      const triggerIdxLeft = this.findTriggerIndex(left);
      this.waveformLineLeft.points(buildPoints(left, triggerIdxLeft, samples));

      const triggerIdxRight = this.findTriggerIndex(right);
      this.waveformLineRight.points(buildPoints(right, triggerIdxRight, samples));

      group.getLayer()?.batchDraw();
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  protected override onLinked(plugPosition: number, target: Mod): void {
    if (plugPosition === PlugPosition.NORTH
        && this.animationFrameId === null
        && this.waveformLineLeft
        && this.group) {
      this.startAnimation(this.group as Konva.Group);
    }
    super.onLinked(plugPosition, target);
  }

  protected override onUnlinked(plugPosition: number, prev: Mod): void {
    if (plugPosition === PlugPosition.NORTH) {
      this.waveformLineLeft?.points([]);
      this.waveformLineRight?.points([]);
      this.waveformLineLeft?.getLayer()?.batchDraw();
    }
    super.onUnlinked(plugPosition, prev);
  }

  protected override onSnatched(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this._upmixNode) {
      this._upmixNode.dispose();
      this._upmixNode = null;
    }
    super.onSnatched();
  }
}
