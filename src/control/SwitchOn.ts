import Konva from 'konva';
import AudioMod from '../core/AudioMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import Signals from '../core/Signals';
import AudioSignal from '../core/AudioSignal';
import BrokenAudioSignal from '../core/BrokenAudioSignal';

export default class SwitchOn extends AudioMod {
  signal: AudioSignal|null = null;

  private subgroup: Konva.Group|null = null;

  private insideRect: Konva.Rect|null = null;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.NULL, PlugType.OUT]);
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
      if (this.signal) {
        this.pushOutput(PlugPosition.SOUTH, this.signal);
      }
    };

    const pressOff = () => {
      if (this.signal instanceof AudioSignal) {
        this.pushOutput(PlugPosition.SOUTH, new BrokenAudioSignal(this.signal.node));
      }
    };

    this.insideRect.on('mousedown', pressOn);
    this.insideRect.on('mouseup', pressOff);

    this.insideRect.on('touchstart', (e) => {
      // Prevent stage pan and mod drag on tap
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

  onSignalChanged(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];

    const inputSignal = inputSignals[PlugPosition.NORTH];
    if (inputSignal instanceof AudioSignal) {
      this.signal = inputSignal;
    } else if (inputSignal instanceof BrokenAudioSignal) {
      outputSignals[PlugPosition.SOUTH] = inputSignal;
    }

    return outputSignals;
  }
}
