import AudioMod from './audio-mod';
import PlugType from './plug-type';
import { Signals, AudioSignal, BrokenAudioSignal} from './signal';
import Konva from 'konva';
import PlugPosition from './plug-position';
import { AudioContext, GainNode } from 'standardized-audio-context';

export default class Speaker extends AudioMod {
  gain: GainNode<AudioContext>|null = null;

  constructor() {
    super();

    this.configure('', 1, 1, [PlugType.IN]);

    // This is particular to the speaker.
    // We need to specifically disconnect fron AudioContext when snatching the Mod
    // because it is the last one in the chain.
    // TODO we should get rid of that using a ending hidden mod
    this.events.on('snatched', () => {
      if (this.audioContext && this.gain) {
        this.gain.disconnect(this.audioContext.destination);
        this.gain = null;
      }
    });
  }

  draw(group:Konva.Group) {

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

  getOutputs(inputSignals: Signals): Signals {
    if (this.audioContext) {
      const signal = inputSignals[PlugPosition.NORTH];
      const duration = 0.05;
      if (signal instanceof AudioSignal) {
        if (!this.gain) {
          // We create an Gain just to disconnect it properly
          this.gain = this.audioContext.createGain();
          this.gain.gain.value = 0.0001;
        }
        this.gain.gain.exponentialRampToValueAtTime(1, this.audioContext.currentTime + duration);
        signal.node.connect(this.gain);
        this.gain.connect(this.audioContext.destination);
      } else if (signal instanceof BrokenAudioSignal && this.gain) {
        this.gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + duration);
        setTimeout(() => {
          signal.node.disconnect();
          if (this.gain && this.audioContext) {
            this.gain.disconnect(this.audioContext.destination);
            this.gain = null;
          }
        }, duration * 1000 + 1000);
      }
    }

    return [null, null, null, null];
  }
}
