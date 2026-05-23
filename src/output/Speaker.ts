import { Gain as ToneGain, getDestination } from 'tone';
import type { ToneAudioNode } from 'tone';
import Konva from 'konva';
import AudioMod from '../core/AudioMod';
import PlugType from '../core/PlugType';
import Signals from '../core/Signals';
import AudioSignal from '../core/AudioSignal';
import ControlSignal from '../core/ControlSignal';
import BrokenAudioSignal from '../core/BrokenAudioSignal';
import PlugPosition from '../core/PlugPosition';

export default class Speaker extends AudioMod {
  private gainNode: ToneGain | null = null;

  private inputNode: ToneAudioNode | null = null;

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
    if (inputSignal instanceof AudioSignal) {
      this.connect(inputSignal);
    } else if (inputSignal instanceof BrokenAudioSignal) {
      this.disconnect(inputSignal);
    }

    const controlSignal = inputSignals[PlugPosition.EAST];
    if (controlSignal instanceof ControlSignal && this.gainNode) {
      this.gain = controlSignal.value;
      this.gainNode.gain.value = this.gain;
    }

    return [null, null, null, null];
  }

  private connect(inputSignal: AudioSignal) {
    if (this.gainNode) {
      this.inputNode?.disconnect(this.gainNode);
      this.gainNode.disconnect();
      this.gainNode.dispose();
    }
    if (inputSignal.node) {
      this.inputNode = inputSignal.node;
      this.gainNode = new ToneGain(this.gain);
      inputSignal.node.connect(this.gainNode);
      this.gainNode.connect(getDestination());
    }
  }

  private disconnect(_: BrokenAudioSignal) {
    if (this.gainNode) {
      this.inputNode?.disconnect(this.gainNode);
      this.gainNode.disconnect();
      this.gainNode.dispose();
      this.gainNode = null;
      this.inputNode = null;
    }
  }
}
