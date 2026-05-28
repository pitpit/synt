import { Gain as ToneGain } from 'tone';
import type { ToneAudioNode } from 'tone';
import Konva from 'konva';
import EffectMod from '../core/EffectMod';
import PlugType from '../core/PlugType';

export default class SwitchOn extends EffectMod {
  private subgroup: Konva.Group | null = null;

  private interactionRect: Konva.Rect | null = null;

  private insideRect: Konva.Rect | null = null;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  protected createEffectNode(): ToneAudioNode {
    return new ToneGain(0);
  }

  private drawSwitchOn(group: Konva.Group) {
    const outerPadding = 30;
    const innerPadding = outerPadding + 5;
    const width = group.width() - outerPadding * 2;
    const height = group.height() - outerPadding * 2;

    this.subgroup = new Konva.Group();
    const outsideRect = new Konva.Rect({
      name: 'switch-on-outer',
      x: outerPadding,
      y: outerPadding,
      width,
      height,
      cornerRadius: 5,
      stroke: 'black',
      strokeWidth: 3,
    });
    this.subgroup.add(outsideRect);

    this.interactionRect = new Konva.Rect({
      name: 'switch-on-interaction',
      x: outerPadding,
      y: outerPadding,
      width,
      height,
      cornerRadius: 5,
      fill: 'rgba(0, 0, 0, 0.001)',
      strokeEnabled: false,
    });

    const insideRect = new Konva.Rect({
      name: 'switch-on-inner',
      x: innerPadding,
      y: innerPadding,
      width: group.width() - innerPadding * 2,
      height: group.height() - innerPadding * 2,
      cornerRadius: 2.5,
      stroke: 'black',
      fill: 'black',
      strokeWidth: 1,
    });
    this.insideRect = insideRect;
    this.subgroup.add(insideRect);
    this.subgroup.add(this.interactionRect);

    group.add(this.subgroup);
  }

  private addTouchListener(group: Konva.Group) {
    if (!this.interactionRect) return;

    this.interactionRect.on('mouseenter', () => {
      document.body.style.cursor = 'pointer';
    });

    this.interactionRect.on('mouseleave', () => {
      document.body.style.cursor = 'grab';
    });

    const pressOn = () => {
      (this.ensureEffectNode() as ToneGain).gain.value = 1;
    };

    const pressOff = () => {
      (this.ensureEffectNode() as ToneGain).gain.value = 0;
    };

    this.interactionRect.on('mousedown', (e) => {
      e.cancelBubble = true;
      group.draggable(false);
      pressOn();
    });

    this.interactionRect.on('mouseup', (e) => {
      e.cancelBubble = true;
      group.draggable(true);
      pressOff();
    });

    this.interactionRect.on('touchstart', (e) => {
      e.cancelBubble = true;
      group.draggable(false);
      pressOn();
    });

    this.interactionRect.on('touchend', (e) => {
      e.cancelBubble = true;
      group.draggable(true);
      pressOff();
    });
  }

  draw(group: Konva.Group) {
    this.drawSwitchOn(group);
    if (this.rack !== null) {
      this.addTouchListener(group);
    }
  }
}
