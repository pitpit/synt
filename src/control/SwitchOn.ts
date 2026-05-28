import { Gain as ToneGain } from 'tone';
import type { ToneAudioNode } from 'tone';
import Konva from 'konva';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';

export default class SwitchOn extends EffectMod {
  private subgroup: Konva.Group | null = null;

  private insideRect: Konva.Rect | null = null;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneGain(0);
  }

  private drawSwitchOn(group: Konva.Group) {
    let padding: number = 30;

    this.subgroup = new Konva.Group();
    const outsideRect = new Konva.Rect({
      x: padding,
      y: padding,
      width: group.width() - padding * 2,
      height: group.height() - padding * 2,
      cornerRadius: 5,
      stroke: 'black',
      strokeWidth: 3,
    });
    this.subgroup.add(outsideRect);

    padding += 5;
    const insideRect = new Konva.Rect({
      x: padding,
      y: padding,
      width: group.width() - padding * 2,
      height: group.height() - padding * 2,
      cornerRadius: 2.5,
      stroke: 'black',
      fill: 'black',
      strokeWidth: 1,
    });
    this.insideRect = insideRect;
    this.subgroup.add(insideRect);

    group.add(this.subgroup);
  }

  private addTouchListener(group: Konva.Group) {
    if (!this.insideRect) return;

    const pressOn = () => {
      (this.ensureEffectNode() as ToneGain).gain.value = 1;
    };

    const pressOff = () => {
      (this.ensureEffectNode() as ToneGain).gain.value = 0;
    };

    this.insideRect.on('mousedown', pressOn);
    this.insideRect.on('mouseup', pressOff);

    this.insideRect.on('touchstart', (e) => {
      e.cancelBubble = true;
      group.draggable(false);
      pressOn();
    });

    this.insideRect.on('touchend', (e) => {
      e.cancelBubble = true;
      group.draggable(true);
      pressOff();
    });
  }

  draw(group: Konva.Group) {
    this.drawSwitchOn(group);
    this.addTouchListener(group);
  }
}
