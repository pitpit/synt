import Mod from './mod';
import PlugType from './plug-type';
import Konva from 'konva';
import PlugPosition from './plug-position';

export default class Speaker extends Mod {
  constructor() {
    super();

    this.configure('', 1, 1, [PlugType.IN]);
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

  wire(audioContext:AudioContext): void {
    // Get output from input plug
    const input = this.getInput(PlugPosition.NORTH);
    if (input instanceof AudioNode) {
      input.connect(audioContext.destination);
    }
  }

  unwire(audioContext:AudioContext): void {
    // Get output from input plug
    const input = this.getInput(PlugPosition.NORTH);
    if (input instanceof AudioNode) {
      input.disconnect(audioContext.destination);
    }
  }
}
