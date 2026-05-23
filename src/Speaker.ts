import type { binops } from 'gibberish-dsp';
import Gibberish from 'gibberish-dsp';
import Konva from 'konva';
import AudioMod from './AudioMod';
import PlugType from './PlugType';
import Signals from './Signals';
import AudioSignal from './AudioSignal';
import ControlSignal from './ControlSignal';
import BrokenAudioSignal from './BrokenAudioSignal';
import PlugPosition from './PlugPosition';

export default class Speaker extends AudioMod {
  private gainNode: binops.MulNode | null = null;

  gain: number = 0.5;

  constructor() {
    super();
    this.configure([PlugType.IN, PlugType.CTRLIN]);
  }

  draw(group: Konva.Group) {
    const outterCircleRadius = 32;
    const outterCircleStrokeWidth = 8;
    const innerCircleRadius = 10;
    const innerCircleStrokeWidth = 2;

    const outterCircle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: outterCircleRadius,
      // fill: null,
      fillEnabled: false,
      stroke: 'black',
      strokeWidth: outterCircleStrokeWidth,
    });
    const topLeftArc = new Konva.Arc({
      x: group.width() / 2,
      y: group.height() / 2,
      innerRadius: innerCircleRadius + innerCircleStrokeWidth / 2,
      outerRadius: outterCircleRadius - outterCircleStrokeWidth / 2,
      fill: 'lightgray',
      angle: 180,
      rotation: 135,
    });
    // const bottomRightArc = new Konva.Arc({
    //   x: group.width() / 2,
    //   y: group.height() / 2,
    //   innerRadius: innerCircleRadius + innerCircleStrokeWidth / 2,
    //   outerRadius: outterCircleRadius - outterCircleStrokeWidth / 2,
    //   fill: 'white',
    //   angle: 180,
    //   rotationDeg: -45,
    // });
    const innerCircle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: innerCircleRadius,
      fill: 'black',
      stroke: 'black',
      strokeWidth: innerCircleStrokeWidth,
    });

    const reflectCircle = new Konva.Circle({
      x: group.width() / 2 + 4,
      y: group.height() / 2 - 4,
      radius: 2.5,
      fill: 'white',
    });

    group.add(outterCircle);
    group.add(topLeftArc);
    // group.add(bottomRightArc);
    group.add(innerCircle);
    group.add(reflectCircle);
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const inputSignal = inputSignals[PlugPosition.NORTH];
    if (inputSignal instanceof AudioSignal && inputSignal.node) {
      if (this.gainNode?.disconnect) {
        this.gainNode.disconnect();
      }
      this.gainNode = Gibberish.binops.Mul(inputSignal.node, this.gain);
      this.gainNode.connect?.();
    } else if (inputSignal instanceof BrokenAudioSignal) {
      if (this.gainNode?.disconnect) {
        this.gainNode.disconnect();
      }
      this.gainNode = null;
    }

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal && this.gainNode) {
      this.gain = controlSignal.value;
      this.gainNode[1] = this.gain;
    }

    return [null, null, null, null];
  }
}
