import Konva from 'konva';
import Gibberish from 'gibberish-dsp';
import AudioMod from './AudioMod';
import PlugType from './PlugType';
import { Signals, Signal } from './Signal';
import AudioSignal from './AudioSignal';
import PlugPosition from './PlugPosition';

export default class Speaker extends AudioMod {
  constructor() {
    super();
    this.configure([PlugType.IN]);
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
      rotationDeg: 135,
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

  onSignalBroken(plugPosition: number, inputSignal: Signal): void {
    if (plugPosition === PlugPosition.NORTH && inputSignal instanceof AudioSignal && inputSignal.node && inputSignal.node.disconnect) {
      inputSignal.node.disconnect();
    }
  }

  onSignalChanged(inputSignals: Signals): Signals {
    const inputSignal = inputSignals[PlugPosition.NORTH];

    // I don't no how to test the node is a Giberrish object, so only test it has a connect function
    if (inputSignal instanceof AudioSignal && inputSignal.node && inputSignal.node.connect) {
      inputSignal.node.connect();
    }

    return [null, null, null, null];
  }
}
