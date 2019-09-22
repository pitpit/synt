import AudioMod from './AudioMod';
import PlugType from './PlugType';
import PlugPosition from './PlugPosition';
import Konva from 'konva';
import { Signals, AudioSignal, BrokenAudioSignal, ControlSignal } from './Signal';
import { AudioContext, GainNode } from 'standardized-audio-context';

export default class SwitchOn extends AudioMod {
  gain: GainNode<AudioContext>|null = null;

  constructor() {
    super();
    this.configure('', 1, 1, [PlugType.IN, PlugType.NULL, PlugType.OUT]);
  }

  draw(group:Konva.Group) {
    let padding: number = 30;

    const subgroup = new Konva.Group();
    const outsideRect = new Konva.Rect({
      x: padding,
      y: padding,
      width:  group.width() - padding*2,
      height: group.height() - padding*2,
      cornerRadius: 5,
      stroke: 'black',
      strokeWidth: 3,
    });
    subgroup.add(outsideRect);

    padding += 5;
    const insideRect = new Konva.Rect({
      x: padding,
      y: padding,
      width:  group.width() - padding*2,
      height: group.height() - padding*2,
      cornerRadius: 2.5,
      stroke: 'black',
      fill: 'black',
      strokeWidth: 1,
    });
    subgroup.add(insideRect);

    subgroup.on('mousedown', () => {
      if (this.gain) {
        this.pushOutput(PlugPosition.SOUTH, new AudioSignal(this.gain));
      }
    });

    subgroup.on('mouseup', () => {
      if (this.gain) {
        this.pushOutput(PlugPosition.SOUTH, new BrokenAudioSignal(this.gain));
      }
    });

    group.add(subgroup);
  }

  getOutputs(inputSignals: Signals): Signals {
    const outputSignals: Signals = [null, null, null, null];
    const signal = inputSignals[PlugPosition.NORTH];
    if (signal instanceof AudioSignal) {
      if (this.audioContext) {
        if (!this.gain) {
          this.gain = this.audioContext.createGain();
        }
        signal.node.connect(this.gain);
        // outputSignals[PlugPosition.SOUTH] = new AudioSignal(this.gain);
      }
    } else if (signal instanceof BrokenAudioSignal) {
      signal.node.disconnect();
      this.gain = null;
      // Transmit BrokenAudioSignal as it
      outputSignals[PlugPosition.SOUTH] = signal;
    }

    return outputSignals;
  }
}
