import Mod from './mod';
import IoType from './ioType';
import Konva from 'konva';
import Cardinal from './cardinal';

export default class Speaker extends Mod {
  constructor() {
    super();

    this.configure('', 1, 1, [IoType.IN]);
  }

  draw(group:Konva.Group) {
    const circle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: 24,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 6,
    });

    const innerCircle = new Konva.Circle({
      x: group.width() / 2,
      y: group.height() / 2,
      radius: 12,
      fill: 'white',
      stroke: 'black',
      strokeWidth: 3,
    });

    group.add(circle);
    group.add(innerCircle);
  }

  unwire(audioContext:AudioContext): void {
    // Get output from input Io
    const output = this.getInput(Cardinal.NORTH);
    if (output instanceof AudioNode) {
      output.disconnect(audioContext.destination);
    }
  }

  wire(audioContext:AudioContext): void {
    // Get output from input Io
    const output = this.getInput(Cardinal.NORTH);
    if (output instanceof AudioNode) {
      output.connect(audioContext.destination);
    }
  }
}
