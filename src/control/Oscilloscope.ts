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
  private static readonly TARGET_FRAME_MS = 33;

  private waveformLineLeft: Konva.Line | null = null;

  private waveformLineRight: Konva.Line | null = null;

  private animationFrameId: number | null = null;

  private _upmixNode: ToneGain | null = null;

  /** Number of samples drawn per frame — controls time window width. Range [16, 2048]. */
  private samples: number = 1024;

  /** Amplitude multiplier applied to the waveform. Range [0.1, 10]. */
  private amplitude: number = 0.5;

  private leftPoints: number[] = [];

  private rightPoints: number[] = [];

  private lastFrameTs = 0;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN, PlugType.OUT, PlugType.CTRLIN], 'scope');
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
      rawGain.channelCount = 2;
      rawGain.channelCountMode = 'explicit';
      rawGain.channelInterpretation = 'speakers';
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
      // 16 × 2^(value × 12): default knob (0.5) → 1024 samples.
      this.samples = Math.min(2048, Math.round(16 * Math.pow(2, eastSignal.value * 12)));
    }
    const westSignal = inputSignals[PlugPosition.WEST];
    if (westSignal instanceof ControlSignal) {
      // Log scale [0.05, 5]: knob left = zoomed out, knob right = zoomed in.
      // default knob (0.5) → amplitude 0.5.
      this.amplitude = 0.05 * Math.pow(100, westSignal.value);
    }
    return super.onSignalChanged(inputSignals);
  }

  /**
   * Find the first rising zero-crossing in the buffer, leaving at least `samples`
   * entries after the index. Returns 0 as fallback when no crossing is found.
   */
  private findTriggerIndex(data: Float32Array, samples: number): number {
    const searchLimit = data.length - samples;
    for (let i = 1; i < searchLimit; i += 1) {
      if (data[i - 1] < 0 && data[i] >= 0) {
        return i;
      }
    }
    return 0;
  }

  private hasInputSource(): boolean {
    return this.plugs.getPlug(PlugPosition.NORTH).mod !== null;
  }

  private fillPoints(
    data: Float32Array,
    triggerIdx: number,
    samples: number,
    points: number[],
    padX: number,
    dw: number,
    midY: number,
    ampScale: number,
  ): number[] {
    const needed = samples * 2;
    if (points.length !== needed) {
      points.length = needed;
    }
    const stepX = samples > 1 ? dw / (samples - 1) : 0;

    for (let i = 0; i < samples; i += 1) {
      points[2 * i] = padX + i * stepX;
      points[2 * i + 1] = midY - data[triggerIdx + i] * ampScale;
    }
    return points;
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

    const clipGroup = new Konva.Group({
      clip: {
        x: padX, y: padY, width: dw, height: dh,
      },
    });
    group.add(clipGroup);

    this.waveformLineLeft = new Konva.Line({
      points: [],
      stroke: '#ffffff',
      strokeWidth: 1.5,
      listening: false,
    });
    clipGroup.add(this.waveformLineLeft);

    this.waveformLineRight = new Konva.Line({
      points: [],
      stroke: '#ff4444',
      strokeWidth: 1.5,
      listening: false,
    });
    clipGroup.add(this.waveformLineRight);

    if (this.hasInputSource()) {
      this.startAnimation(group);
    }
  }

  private startAnimation(group: Konva.Group): void {
    if (this.animationFrameId !== null) return;

    const w = group.width();
    const h = group.height();
    const padX = 10;
    const padY = 10;
    const dw = w - 2 * padX;
    const dh = h - 2 * padY;
    const midY = padY + dh / 2;

    const animate = (timestamp: number) => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (!this.effectNode || !this.waveformLineLeft || !this.waveformLineRight) return;
      if (!this.hasInputSource()) return;
      if (timestamp - this.lastFrameTs < Oscilloscope.TARGET_FRAME_MS) return;

      this.lastFrameTs = timestamp;

      const [left, right] = (this.effectNode as ToneAnalyser).getValue() as Float32Array[];
      const samples = Math.max(16, Math.min(this.samples, left.length, right.length));
      const ampScale = this.amplitude * (dh / 2 - 2);

      const triggerIdxLeft = this.findTriggerIndex(left, samples);
      this.waveformLineLeft.points(this.fillPoints(
        left,
        triggerIdxLeft,
        samples,
        this.leftPoints,
        padX,
        dw,
        midY,
        ampScale,
      ));

      const triggerIdxRight = this.findTriggerIndex(right, samples);
      this.waveformLineRight.points(this.fillPoints(
        right,
        triggerIdxRight,
        samples,
        this.rightPoints,
        padX,
        dw,
        midY,
        ampScale,
      ));

      group.getLayer()?.batchDraw();
    };

    this.lastFrameTs = 0;
    this.animationFrameId = requestAnimationFrame(animate);
  }

  protected override onLinked(plugPosition: number, target: Mod): void {
    if (plugPosition === PlugPosition.NORTH
        && this.animationFrameId === null
        && this.waveformLineLeft
        && this.group) {
      this.startAnimation(this.group);
    }
    super.onLinked(plugPosition, target);
  }

  protected override onUnlinked(plugPosition: number, prev: Mod): void {
    if (plugPosition === PlugPosition.NORTH) {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.lastFrameTs = 0;
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
