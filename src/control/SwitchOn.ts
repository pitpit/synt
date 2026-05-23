import Konva from 'konva';
import AudioMod from '../core/AudioMod';
import PlugType from '../core/PlugType';
import PlugPosition from '../core/PlugPosition';
import Signals from '../core/Signals';
import AudioSignal from '../core/AudioSignal';
import BrokenAudioSignal from '../core/BrokenAudioSignal';

export default class SwitchOn extends AudioMod {
  signal: AudioSignal|null = null;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  draw(group:Konva.Group) {
    let padding: number = 30;

    const subgroup = new Konva.Group();
    const outsideRect = new Konva.Rect({
      x: padding,
      y: padding,
      width: group.width() - padding * 2,
      height: group.height() - padding * 2,
      cornerRadius: 5,
      stroke: 'black',
      strokeWidth: 3,
    });
    subgroup.add(outsideRect);

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
    subgroup.add(insideRect);

    subgroup.on('mousedown', () => {
      if (this.signal) {
        this.pushOutput(PlugPosition.SOUTH, this.signal);
      }
    });

    subgroup.on('mouseup', () => {
      if (this.signal instanceof AudioSignal) {
        this.pushOutput(PlugPosition.SOUTH, new BrokenAudioSignal(this.signal.node));
      }
    });

    group.add(subgroup);
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
